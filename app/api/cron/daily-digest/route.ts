import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getEnv } from '@/lib/config/env'
import { verifyBearerToken } from '@/lib/utils/auth'
import { subDays, format } from 'date-fns'

export const runtime = 'nodejs'
export const maxDuration = 120

interface DigestVideo {
  videoId: string
  title: string
  channelName: string | null
  overallScore: number
  thumbnailUrl: string | null
}

interface ProfileDigest {
  profileId: string
  profileName: string
  videos: DigestVideo[]
}

export async function GET(request: Request) {
  const startTime = Date.now()
  const env = getEnv()
  const authHeader = request.headers.get('authorization')

  if (!verifyBearerToken(authHeader, env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  let profilesProcessed = 0
  let alertsCreated = 0

  try {
    // Log job run start
    const { data: jobRun } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'daily_digest',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    const jobRunId = jobRun?.id

    // Check user settings for digest
    const { data: settings } = await supabase
      .from('user_settings')
      .select('digest_enabled, default_score_threshold')
      .limit(1)
      .maybeSingle()

    // If digest is disabled, skip
    if (settings && !settings.digest_enabled) {
      if (jobRunId) {
        await supabase
          .from('job_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            items_processed: 0,
            metadata: { skipped: true, reason: 'digest_disabled' }
          })
          .eq('id', jobRunId)
      }

      return NextResponse.json({
        success: true,
        message: 'Daily digest is disabled in user settings'
      })
    }

    const scoreThreshold = settings?.default_score_threshold || 75
    const yesterday = subDays(new Date(), 1)
    const formattedDate = format(yesterday, 'yyyy-MM-dd')

    // Get all active profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('is_active', true)

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`)
    }

    if (!profiles?.length) {
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
        message: 'No active profiles found'
      })
    }

    const digests: ProfileDigest[] = []

    // Process each profile
    for (const profile of profiles) {
      profilesProcessed++

      // Get high-scoring videos from the last 24 hours for this profile
      const { data: cards, error: cardsError } = await supabase
        .from('profile_video_cards')
        .select(`
          id,
          video_id,
          created_at,
          videos!inner(
            id,
            youtube_id,
            title,
            channel_name,
            thumbnail_url
          ),
          scores(
            overall_score
          )
        `)
        .eq('profile_id', profile.id)
        .gte('created_at', yesterday.toISOString())

      if (cardsError) {
        console.error(`Failed to fetch cards for profile ${profile.id}:`, cardsError)
        continue
      }

      if (!cards?.length) {
        continue
      }

      // Filter to high-scoring videos
      const highScoringVideos: DigestVideo[] = []
      for (const card of cards) {
        const video = card.videos as unknown as {
          id: string
          youtube_id: string
          title: string
          channel_name: string | null
          thumbnail_url: string | null
        }
        const scores = card.scores as unknown as Array<{ overall_score: number }> | null
        const score = scores?.[0]?.overall_score

        if (score && score >= scoreThreshold) {
          highScoringVideos.push({
            videoId: video.youtube_id,
            title: video.title,
            channelName: video.channel_name,
            overallScore: score,
            thumbnailUrl: video.thumbnail_url
          })
        }
      }

      // Sort by score descending and limit to top 10
      highScoringVideos.sort((a, b) => b.overallScore - a.overallScore)
      const topVideos = highScoringVideos.slice(0, 10)

      if (topVideos.length > 0) {
        digests.push({
          profileId: profile.id,
          profileName: profile.name,
          videos: topVideos
        })
      }
    }

    // Create digest alerts for each profile
    for (const digest of digests) {
      const videoList = digest.videos
        .map((v, i) => `${i + 1}. ${v.title} (Score: ${v.overallScore})`)
        .join('\n')

      await supabase
        .from('alerts')
        .insert({
          profile_id: digest.profileId,
          alert_type: 'category_digest',
          title: `Daily Digest: ${digest.videos.length} high-scoring videos`,
          message: `New videos from ${formattedDate} scoring ${scoreThreshold}+ in "${digest.profileName}":\n\n${videoList}`,
          is_read: false
        })

      alertsCreated++
    }

    // Update job run
    if (jobRunId) {
      await supabase
        .from('job_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          items_processed: profilesProcessed,
          metadata: {
            alertsCreated,
            digestsGenerated: digests.length,
            scoreThreshold
          }
        })
        .eq('id', jobRunId)
    }

    return NextResponse.json({
      success: true,
      profilesProcessed,
      alertsCreated,
      digestsGenerated: digests.length,
      scoreThreshold
    })
  } catch (error) {
    console.error('Daily digest error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal error',
        profilesProcessed,
        alertsCreated
      },
      { status: 500 }
    )
  }
}
