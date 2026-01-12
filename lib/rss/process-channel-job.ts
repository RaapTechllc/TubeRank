import { createServerClient } from '@/lib/supabase/server'
import { fetchYouTubeChannelFeed } from './youtube-parser'

interface JobPayload {
  channel_youtube_id: string
  channel_name?: string
  triggered_by: 'manual' | 'cron'
}

export interface ProcessResult {
  success: boolean
  videosProcessed: number
  cardsCreated: number
  error?: string
}

/**
 * Process a single channel RSS ingestion job
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
      return { success: true, videosProcessed: 0, cardsCreated: 0 }
    }

    let cardsCreated = 0

    // Process each video
    for (const video of videos) {
      // Upsert video
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .upsert({
          youtube_id: video.youtube_id,
          channel_id: video.channel_id,
          channel_name: video.channel_name,
          title: video.title,
          description: video.description,
          published_at: video.published_at,
          thumbnail_url: video.thumbnail_url,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'youtube_id',
          ignoreDuplicates: false
        })
        .select('id')
        .single()

      if (videoError) {
        console.error(`Failed to upsert video ${video.youtube_id}:`, videoError)
        continue
      }

      // Find profiles with this channel as a source
      const { data: profileSources } = await supabase
        .from('profile_sources')
        .select('profile_id, profiles!inner(is_active)')
        .eq('source_type', 'channel')
        .eq('source_value', channelId)

      if (!profileSources || profileSources.length === 0) {
        continue
      }

      // Create cards for each profile
      for (const source of profileSources) {
        const profiles = source.profiles as unknown as { is_active: boolean } | null
        if (!profiles?.is_active) continue

        // Check if card already exists
        const { data: existingCard } = await supabase
          .from('profile_video_cards')
          .select('id')
          .eq('profile_id', source.profile_id)
          .eq('video_id', videoData.id)
          .maybeSingle()

        if (existingCard) {
          continue
        }

        // Create new card
        const { error: cardError } = await supabase
          .from('profile_video_cards')
          .insert({
            profile_id: source.profile_id,
            video_id: videoData.id,
            column_status: 'inbox',
            position: 0
          })

        if (!cardError) {
          cardsCreated++
        }
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
      cardsCreated
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      videosProcessed: 0,
      cardsCreated: 0,
      error: errorMessage
    }
  }
}
