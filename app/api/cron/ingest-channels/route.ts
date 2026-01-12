import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getBatchJobs, markJobRunning, markJobFailed, completeJob, getNextJob } from '@/lib/jobs/queue'
import { processChannelJob } from '@/lib/rss/process-channel-job'
import { getEnv } from '@/lib/config/env'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const startTime = Date.now()
  const env = getEnv()

  // Verify authorization using constant-time comparison
  const authHeader = request.headers.get('authorization')
  const { verifyBearerToken } = await import('@/lib/utils/auth')
  if (!verifyBearerToken(authHeader, env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  let processed = 0
  let succeeded = 0
  let failed = 0

  try {
    const batchSize = env.JOB_BATCH_SIZE
    const timeoutBuffer = env.JOB_TIMEOUT_BUFFER_MS

    // Fetch batch of pending jobs
    const jobs = await getBatchJobs('rss_fetch_channel', batchSize)

    // Log job run start
    const { data: jobRun } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'rss_fetch_channel',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    const jobRunId = jobRun?.id

    // Process each job
    for (const job of jobs) {
      // Check timeout
      const elapsed = Date.now() - startTime
      const maxDurationMs = (maxDuration || 60) * 1000
      if (elapsed > maxDurationMs - timeoutBuffer) {
        console.log(`Approaching timeout, stopping after ${processed} jobs`)
        break
      }

      processed++

      try {
        // Mark job as running
        await markJobRunning(job.id, job.attempts)

        // Process the job
        const result = await processChannelJob(job.id, job.payload as any)

        if (result.success) {
          // Mark as completed
          await completeJob(job.id)
          succeeded++
        } else {
          // Handle failure
          const shouldRetry = job.attempts < (job.max_attempts || 3)

          if (shouldRetry) {
            await markJobFailed(job.id, result.error || 'Unknown error', true)
          } else {
            // Max attempts reached - mark failed and create alert
            await markJobFailed(job.id, result.error || 'Unknown error', false)

            const payload = job.payload as any
            await supabase
              .from('alerts')
              .insert({
                alert_type: 'feed_error',
                title: `Failed to fetch channel: ${payload.channel_name || payload.channel_youtube_id}`,
                message: result.error || 'Unknown error after 3 attempts',
                is_read: false
              })
          }
          failed++
        }
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)
        const errorMsg = error instanceof Error ? error.message : String(error)
        const shouldRetry = job.attempts < (job.max_attempts || 3)
        await markJobFailed(job.id, errorMsg, shouldRetry)
        failed++
      }
    }

    // Update job run
    if (jobRunId) {
      const endTime = Date.now()
      await supabase
        .from('job_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_ms: endTime - startTime,
          items_processed: processed
        })
        .eq('id', jobRunId)
    }

    return NextResponse.json({
      success: true,
      processed,
      succeeded,
      failed
    })
  } catch (error) {
    console.error('Cron job error:', error)
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
