import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getEnv } from '@/lib/config/env'
import { verifyBearerToken } from '@/lib/utils/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

interface YouTubeSearchItem {
  id: { videoId: string }
  snippet: {
    channelId: string
    channelTitle: string
    title: string
    description: string
    publishedAt: string
    thumbnails: { high?: { url: string } }
  }
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[]
  error?: { message: string }
}

function getLastDayISO(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString()
}

export async function GET(request: Request) {
  const startTime = Date.now()
  const env = getEnv()
  const authHeader = request.headers.get('authorization')

  if (!verifyBearerToken(authHeader, env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  let processed = 0
  let succeeded = 0
  let failed = 0
  let videosFound = 0

  try {
    // Check for YouTube API key
    const youtubeApiKey = env.YOUTUBE_API_KEY
    if (!youtubeApiKey) {
      return NextResponse.json({
        success: false,
        error: 'YOUTUBE_API_KEY not configured. Keyword ingestion requires YouTube Data API.'
      }, { status: 500 })
    }

    // Log job run start
    const { data: jobRun } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'keyword_search',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    const jobRunId = jobRun?.id

    // Get all keyword sources from active profiles
    const { data: sources, error: sourcesError } = await supabase
      .from('profile_sources')
      .select('id, profile_id, source_value, metadata, profiles!inner(is_active)')
      .eq('source_type', 'keyword')

    if (sourcesError) {
      throw new Error(`Failed to fetch keyword sources: ${sourcesError.message}`)
    }

    if (!sources?.length) {
      // Update job run
      if (jobRunId) {
        await supabase
          .from('job_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            items_processed: 0
          })
          .eq('id', jobRunId)
      }

      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: 'No keyword sources found' 
      })
    }

    // Filter to active profiles only
    const activeKeywords = sources.filter(s => {
      const profiles = s.profiles as unknown as { is_active: boolean } | null
      return profiles?.is_active === true
    })

    // Dedupe keywords (same keyword might be in multiple profiles)
    const keywordProfiles = new Map<string, string[]>()
    for (const source of activeKeywords) {
      const keyword = source.source_value.toLowerCase().trim()
      const existing = keywordProfiles.get(keyword) || []
      existing.push(source.profile_id)
      keywordProfiles.set(keyword, existing)
    }

    // Check quota before processing
    const today = new Date().toISOString().split('T')[0]
    const { data: quota } = await supabase
      .from('quota_usage')
      .select('units_used, units_limit')
      .eq('api_name', 'youtube_search')
      .eq('date', today)
      .maybeSingle()

    const currentQuota = quota?.units_used || 0
    const quotaLimit = quota?.units_limit || 10000
    const searchCost = 100 // YouTube search costs 100 units

    // Limit keywords to process based on remaining quota
    const remainingQuota = quotaLimit - currentQuota
    const maxSearches = Math.floor(remainingQuota / searchCost)
    const keywordsToProcess = Array.from(keywordProfiles.entries()).slice(0, maxSearches)

    if (keywordsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'YouTube API quota exhausted for today'
      })
    }

    // Process each keyword
    for (const [keyword, profileIds] of keywordsToProcess) {
      processed++

      // Check timeout
      const elapsed = Date.now() - startTime
      const maxDurationMs = (maxDuration || 60) * 1000
      if (elapsed > maxDurationMs - 10000) {
        console.log(`Approaching timeout, stopping after ${processed} keywords`)
        break
      }

      try {
        // Search YouTube for this keyword
        const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
        searchUrl.searchParams.set('part', 'snippet')
        searchUrl.searchParams.set('q', keyword)
        searchUrl.searchParams.set('type', 'video')
        searchUrl.searchParams.set('order', 'date')
        searchUrl.searchParams.set('maxResults', '10')
        searchUrl.searchParams.set('publishedAfter', getLastDayISO())
        searchUrl.searchParams.set('key', youtubeApiKey)

        const response = await fetch(searchUrl.toString())
        const data: YouTubeSearchResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || `YouTube API error: ${response.status}`)
        }

        // Track quota usage
        await supabase.rpc('increment_quota', {
          p_api_name: 'youtube_search',
          p_units: searchCost
        })

        // Process each video found
        for (const item of data.items || []) {
          videosFound++

          const videoData = {
            youtube_id: item.id.videoId,
            channel_id: item.snippet.channelId,
            channel_name: item.snippet.channelTitle,
            title: item.snippet.title,
            description: item.snippet.description,
            published_at: item.snippet.publishedAt,
            thumbnail_url: item.snippet.thumbnails?.high?.url
          }

          // Upsert video
          const { data: video, error: videoError } = await supabase
            .from('videos')
            .upsert(videoData, { onConflict: 'youtube_id' })
            .select('id')
            .single()

          if (videoError || !video) {
            console.error(`Failed to upsert video ${item.id.videoId}:`, videoError)
            continue
          }

          // Create cards for all profiles that have this keyword
          for (const profileId of profileIds) {
            // Check if card already exists
            const { data: existingCard } = await supabase
              .from('profile_video_cards')
              .select('id')
              .eq('profile_id', profileId)
              .eq('video_id', video.id)
              .maybeSingle()

            if (!existingCard) {
              // Create new card
              await supabase
                .from('profile_video_cards')
                .insert({
                  profile_id: profileId,
                  video_id: video.id,
                  column_status: 'inbox',
                  position: 0
                })

              // Create keyword_match alert
              await supabase
                .from('alerts')
                .insert({
                  profile_id: profileId,
                  video_id: video.id,
                  alert_type: 'keyword_match',
                  title: `Keyword match: "${keyword}"`,
                  message: videoData.title,
                  is_read: false
                })
            }
          }
        }

        succeeded++
      } catch (error) {
        console.error(`Keyword search failed for "${keyword}":`, error)
        failed++
      }
    }

    // Update job run
    if (jobRunId) {
      await supabase
        .from('job_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          items_processed: processed,
          metadata: { videosFound, succeeded, failed }
        })
        .eq('id', jobRunId)
    }

    return NextResponse.json({
      success: true,
      processed,
      succeeded,
      failed,
      videosFound
    })
  } catch (error) {
    console.error('Keyword ingestion error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal error',
        processed,
        succeeded,
        failed
      },
      { status: 500 }
    )
  }
}
