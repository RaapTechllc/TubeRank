import { createServerClient } from '@/lib/supabase/server'
import { fetchYouTubeChannelFeed } from './youtube-parser'
import { enqueueJob } from '@/lib/jobs/queue'

interface JobPayload {
  channel_youtube_id: string
  channel_name?: string
  triggered_by: 'manual' | 'cron'
}

export interface ProcessResult {
  success: boolean
  videosProcessed: number
  cardsCreated: number
  transcriptJobsQueued: number
  error?: string
}

/**
 * Process a single channel RSS ingestion job (optimized for batch operations)
 * @param jobId - Job ID
 * @param payload - Job payload containing channel info
 * @returns Process result with success/failure status
 */
export async function processChannelJob(
  jobId: string,
  payload: JobPayload
): Promise<ProcessResult> {
  const supabase = createServerClient()
  const { channel_youtube_id: channelId } = payload

  try {
    // Fetch RSS feed
    const videos = await fetchYouTubeChannelFeed(channelId)

    if (videos.length === 0) {
      return { success: true, videosProcessed: 0, cardsCreated: 0, transcriptJobsQueued: 0 }
    }

    // Batch upsert all videos
    const { data: upsertedVideos, error: videosError } = await supabase
      .from('videos')
      .upsert(
        videos.map(video => ({
          youtube_id: video.youtube_id,
          channel_id: video.channel_id,
          channel_name: video.channel_name,
          title: video.title,
          description: video.description,
          published_at: video.published_at,
          thumbnail_url: video.thumbnail_url,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'youtube_id', ignoreDuplicates: false }
      )
      .select('id, youtube_id')

    if (videosError) {
      throw new Error(`Failed to upsert videos: ${videosError.message}`)
    }

    const videoIds = upsertedVideos.map(v => v.id)
    const videoIdMap = new Map(upsertedVideos.map(v => [v.youtube_id, v.id]))

    // Batch check existing transcripts
    const { data: existingTranscripts } = await supabase
      .from('transcripts')
      .select('video_id')
      .in('video_id', videoIds)

    const transcriptVideoIds = new Set(existingTranscripts?.map(t => t.video_id) || [])

    // Queue transcript jobs for videos without transcripts
    let transcriptJobsQueued = 0
    for (const video of videos) {
      const videoId = videoIdMap.get(video.youtube_id)
      if (videoId && !transcriptVideoIds.has(videoId)) {
        try {
          await enqueueJob('fetch_transcript', {
            video_id: videoId,
            youtube_id: video.youtube_id
          })
          transcriptJobsQueued++
        } catch (queueError) {
          console.error(`Failed to queue transcript job for ${video.youtube_id}:`, queueError)
        }
      }
    }

    // Get all active profile sources for this channel (single query)
    const { data: profileSources } = await supabase
      .from('profile_sources')
      .select('profile_id, profiles!inner(is_active)')
      .eq('source_type', 'channel')
      .eq('source_value', channelId)

    if (!profileSources || profileSources.length === 0) {
      return { success: true, videosProcessed: videos.length, cardsCreated: 0, transcriptJobsQueued }
    }

    const activeProfiles = profileSources
      .filter(s => (s.profiles as unknown as { is_active: boolean })?.is_active)
      .map(s => s.profile_id)

    if (activeProfiles.length === 0) {
      return { success: true, videosProcessed: videos.length, cardsCreated: 0, transcriptJobsQueued }
    }

    // Batch check existing cards
    const { data: existingCards } = await supabase
      .from('profile_video_cards')
      .select('profile_id, video_id')
      .in('profile_id', activeProfiles)
      .in('video_id', videoIds)

    const existingCardKeys = new Set(
      existingCards?.map(c => `${c.profile_id}:${c.video_id}`) || []
    )

    // Prepare cards to insert
    const cardsToInsert = []
    for (const profileId of activeProfiles) {
      for (const videoId of videoIds) {
        const key = `${profileId}:${videoId}`
        if (!existingCardKeys.has(key)) {
          cardsToInsert.push({
            profile_id: profileId,
            video_id: videoId,
            column_status: 'inbox' as const,
            position: 0
          })
        }
      }
    }

    // Batch insert cards
    let cardsCreated = 0
    if (cardsToInsert.length > 0) {
      const { error: cardsError } = await supabase
        .from('profile_video_cards')
        .insert(cardsToInsert)

      if (!cardsError) {
        cardsCreated = cardsToInsert.length
      }
    }

    // Update channel last_checked_at
    await supabase
      .from('channels')
      .update({ last_checked_at: new Date().toISOString() })
      .eq('youtube_id', channelId)

    return {
      success: true,
      videosProcessed: videos.length,
      cardsCreated,
      transcriptJobsQueued
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      videosProcessed: 0,
      cardsCreated: 0,
      transcriptJobsQueued: 0,
      error: errorMessage
    }
  }
}