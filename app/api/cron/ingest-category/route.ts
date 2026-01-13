import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getEnv } from '@/lib/config/env'
import { verifyBearerToken } from '@/lib/utils/auth'
import { enqueueJob } from '@/lib/jobs/queue'

export const runtime = 'nodejs'
export const maxDuration = 120

// YouTube video category IDs
// https://developers.google.com/youtube/v3/docs/videoCategories/list
const CATEGORY_MAP: Record<string, string> = {
  '1': 'Film & Animation',
  '2': 'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '18': 'Short Movies',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '21': 'Videoblogging',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
  '29': 'Nonprofits & Activism',
}

interface YouTubeVideoItem {
  id: string
  snippet: {
    channelId: string
    channelTitle: string
    title: string
    description: string
    publishedAt: string
    thumbnails: { high?: { url: string } }
    categoryId: string
  }
  statistics?: {
    viewCount: string
    likeCount: string
    commentCount: string
  }
}

interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[]
  error?: { message: string }
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
        error: 'YOUTUBE_API_KEY not configured. Category ingestion requires YouTube Data API.'
      }, { status: 500 })
    }

    // Log job run start
    const { data: jobRun } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'category_fetch',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    const jobRunId = jobRun?.id

    // Get all category sources from active profiles
    const { data: sources, error: sourcesError } = await supabase
      .from('profile_sources')
      .select('id, profile_id, source_value, metadata, profiles!inner(is_active)')
      .eq('source_type', 'category')

    if (sourcesError) {
      throw new Error(`Failed to fetch category sources: ${sourcesError.message}`)
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
        message: 'No category sources found' 
      })
    }

    // Filter to active profiles only
    const activeCategories = sources.filter(s => {
      const profiles = s.profiles as unknown as { is_active: boolean } | null
      return profiles?.is_active === true
    })

    // Group profiles by category
    const categoryProfiles = new Map<string, string[]>()
    for (const source of activeCategories) {
      const categoryId = source.source_value.trim()
      const existing = categoryProfiles.get(categoryId) || []
      existing.push(source.profile_id)
      categoryProfiles.set(categoryId, existing)
    }

    // YouTube Videos API costs 1 unit per request (much cheaper than search!)
    const videoCost = 1

    // Process each category
    for (const [categoryId, profileIds] of categoryProfiles.entries()) {
      processed++

      // Check timeout
      const elapsed = Date.now() - startTime
      const maxDurationMs = (maxDuration || 120) * 1000
      if (elapsed > maxDurationMs - 10000) {
        console.log(`Approaching timeout, stopping after ${processed} categories`)
        break
      }

      try {
        // Fetch most popular videos in this category
        const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
        videosUrl.searchParams.set('part', 'snippet,statistics')
        videosUrl.searchParams.set('chart', 'mostPopular')
        videosUrl.searchParams.set('regionCode', 'US')
        videosUrl.searchParams.set('videoCategoryId', categoryId)
        videosUrl.searchParams.set('maxResults', '10')
        videosUrl.searchParams.set('key', youtubeApiKey)

        const response = await fetch(videosUrl.toString())
        const data: YouTubeVideosResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || `YouTube API error: ${response.status}`)
        }

        // Track quota usage
        await supabase.rpc('increment_quota', {
          p_api_name: 'youtube_videos',
          p_units: videoCost
        })

        const categoryName = CATEGORY_MAP[categoryId] || `Category ${categoryId}`

        // Process each video found
        for (const item of data.items || []) {
          videosFound++

          const videoData = {
            youtube_id: item.id,
            channel_id: item.snippet.channelId,
            channel_name: item.snippet.channelTitle,
            title: item.snippet.title,
            description: item.snippet.description,
            published_at: item.snippet.publishedAt,
            thumbnail_url: item.snippet.thumbnails?.high?.url,
            view_count: item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : null,
            like_count: item.statistics?.likeCount ? parseInt(item.statistics.likeCount, 10) : null,
            comment_count: item.statistics?.commentCount ? parseInt(item.statistics.commentCount, 10) : null,
            metadata: { categoryId, categoryName }
          }

          // Upsert video
          const { data: video, error: videoError } = await supabase
            .from('videos')
            .upsert(videoData, { onConflict: 'youtube_id' })
            .select('id')
            .single()

          if (videoError || !video) {
            console.error(`Failed to upsert video ${item.id}:`, videoError)
            continue
          }

          // Queue transcript fetch job for new videos
          const { data: existingTranscript } = await supabase
            .from('transcripts')
            .select('id')
            .eq('video_id', video.id)
            .maybeSingle()

          if (!existingTranscript) {
            try {
              await enqueueJob('fetch_transcript', {
                video_id: video.id,
                youtube_id: item.id
              })
            } catch (queueError) {
              console.error(`Failed to queue transcript job for ${item.id}:`, queueError)
            }
          }

          // Create cards for all profiles that have this category
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
            }
          }
        }

        succeeded++
      } catch (error) {
        console.error(`Category fetch failed for "${categoryId}":`, error)
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
    console.error('Category ingestion error:', error)
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
