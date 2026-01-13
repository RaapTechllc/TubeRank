import { createServerClient } from '@/lib/supabase/server'
import { enqueueJob, checkPendingJobs } from '@/lib/jobs/queue'
import type { EnqueueResult } from './types'

export interface RefreshChannelsOptions {
  profileId?: string
  channelId?: string
}

/**
 * Refresh channels for RSS ingestion (optimized with batch operations)
 * @param options - Options for filtering channels to refresh
 * @returns Result with count of enqueued and skipped jobs
 */
export async function refreshChannels(
  options: RefreshChannelsOptions = {}
): Promise<EnqueueResult> {
  const supabase = createServerClient()

  let query = supabase
    .from('profile_sources')
    .select('source_value, profiles!inner(is_active)')
    .eq('source_type', 'channel')

  if (options.profileId) {
    query = query.eq('profile_id', options.profileId)
  }

  if (options.channelId) {
    query = query.eq('source_value', options.channelId)
  }

  const { data: sources, error } = await query

  if (error) {
    throw new Error(`Failed to fetch channels: ${error.message}`)
  }

  if (!sources || sources.length === 0) {
    return { enqueued: 0, skipped: 0 }
  }

  let enqueued = 0
  let skipped = 0

  const channels = Array.from(
    new Set(
      sources
        .filter((s): s is typeof s & { profiles: { is_active: boolean } } => {
          const profiles = s.profiles as unknown as { is_active: boolean } | null
          return !!profiles?.is_active
        })
        .map(s => s.source_value)
    )
  )

  // Batch check for pending jobs
  const pendingChannels = await checkPendingJobs('rss_fetch_channel', channels)

  for (const channelId of channels) {
    if (pendingChannels.has(channelId)) {
      skipped++
      continue
    }

    await enqueueJob('rss_fetch_channel', {
      channel_youtube_id: channelId,
      triggered_by: 'manual'
    })
    enqueued++
  }

  return { enqueued, skipped }
}