import { createServerClient } from '@/lib/supabase/server'

// Combined job types for RSS/Analytics (Phase 1) and AI Features (Phase 2)
export type JobType =
  // RSS/Analytics Jobs (Phase 1)
  | 'rss_fetch_channel'
  | 'keyword_search'
  | 'category_fetch'
  | 'daily_digest'
  // AI Feature Jobs (Phase 2)
  | 'fetch_transcript'
  | 'summarize_video'
  | 'score_video'
  | 'generate_embedding'

export interface RefreshChannelsOptions {
  profileId?: string
  channelId?: string
}

export interface EnqueueResult {
  enqueued: number
  skipped: number
}

/**
 * Mark a job as running
 * @param jobId - ID of the job
 * @param attempts - Current attempt count
 */
export async function markJobRunning(jobId: string, attempts: number) {
  const supabase = createServerClient()

  await supabase
    .from('job_queue')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      attempts: attempts + 1
    })
    .eq('id', jobId)
}

/**
 * Mark a job as failed with optional retry
 * @param jobId - ID of the job
 * @param error - Error message
 * @param shouldRetry - Whether to mark as pending for retry
 */
export async function markJobFailed(jobId: string, error: string, shouldRetry: boolean) {
  const supabase = createServerClient()

  await supabase
    .from('job_queue')
    .update({
      status: shouldRetry ? 'pending' : 'failed',
      error,
      completed_at: shouldRetry ? null : new Date().toISOString()
    })
    .eq('id', jobId)
}

/**
 * Refresh channels for RSS ingestion
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

  for (const channelId of channels) {
    const hasPending = await checkPendingJob('rss_fetch_channel', channelId)

    if (hasPending) {
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

/**
 * Enqueue a job for processing
 * @param jobType - Type of job to enqueue
 * @param payload - Job payload data
 * @returns Created job record
 */
export async function enqueueJob(
  jobType: JobType,
  payload: Record<string, unknown>
) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('job_queue')
    .insert({ job_type: jobType, payload })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get next available job with atomic locking
 * @param jobType - Type of job to fetch
 * @returns Next job or null if none available
 */
export async function getNextJob(jobType: JobType) {
  const { getNextJob: getNextJobRpc } = await import('./queue-rpc')
  return getNextJobRpc(jobType)
}

/**
 * Mark a job as completed or failed
 * @param jobId - ID of the job
 * @param error - Optional error message if job failed
 */
export async function completeJob(jobId: string, error?: string) {
  const supabase = createServerClient()

  await supabase
    .from('job_queue')
    .update({
      status: error ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      error
    })
    .eq('id', jobId)
}

/**
 * Check if a job is already pending or running
 * @param jobType - Type of job
 * @param channelId - YouTube channel ID
 * @returns True if job exists
 */
export async function checkPendingJob(
  jobType: JobType,
  channelId: string
): Promise<boolean> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from('job_queue')
    .select('id')
    .eq('job_type', jobType)
    .in('status', ['pending', 'running'])
    .eq('payload->>channel_youtube_id', channelId)
    .limit(1)
    .maybeSingle()

  return !!data
}

/**
 * Get batch of jobs for processing
 * @param jobType - Type of job
 * @param limit - Maximum number of jobs to fetch
 * @returns Array of jobs
 */
export async function getBatchJobs(
  jobType: JobType,
  limit: number = 20
) {
  const supabase = createServerClient()

  const { data } = await supabase
    .from('job_queue')
    .select()
    .eq('job_type', jobType)
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  return data || []
}
/**
 * Batch check if jobs are already pending or running
 * @param jobType - Type of job
 * @param channelIds - Array of YouTube channel IDs
 * @returns Set of channel IDs that have pending/running jobs
 */
export async function checkPendingJobs(
  jobType: JobType,
  channelIds: string[]
): Promise<Set<string>> {
  if (channelIds.length === 0) return new Set()

  const supabase = createServerClient()

  const { data } = await supabase
    .from('job_queue')
    .select('payload')
    .eq('job_type', jobType)
    .in('status', ['pending', 'running'])

  const pendingChannels = new Set<string>()
  
  if (data) {
    for (const job of data) {
      const payload = job.payload as { channel_youtube_id?: string }
      if (payload.channel_youtube_id && channelIds.includes(payload.channel_youtube_id)) {
        pendingChannels.add(payload.channel_youtube_id)
      }
    }
  }

  return pendingChannels
}