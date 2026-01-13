import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getBatchJobs, markJobRunning, markJobFailed, completeJob } from '@/lib/jobs/queue'
import { getEnv } from '@/lib/config/env'
import { verifyBearerToken } from '@/lib/utils/auth'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for AI processing

type AIJobType = 'fetch_transcript' | 'summarize_video' | 'score_video' | 'generate_embedding'

// Job processor endpoints
const JOB_ENDPOINTS: Record<AIJobType, string> = {
  fetch_transcript: '/api/jobs/fetch-transcript',
  summarize_video: '/api/jobs/summarize-video',
  score_video: '/api/jobs/score-video',
  generate_embedding: '/api/jobs/generate-embedding',
}

// Processing order - each job type feeds into the next
const JOB_ORDER: AIJobType[] = [
  'fetch_transcript',
  'summarize_video',
  'score_video',
  'generate_embedding',
]

export async function GET(request: Request) {
  const startTime = Date.now()
  const env = getEnv()
  const authHeader = request.headers.get('authorization')

  if (!verifyBearerToken(authHeader, env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const results: Record<AIJobType, { processed: number; succeeded: number; failed: number }> = {
    fetch_transcript: { processed: 0, succeeded: 0, failed: 0 },
    summarize_video: { processed: 0, succeeded: 0, failed: 0 },
    score_video: { processed: 0, succeeded: 0, failed: 0 },
    generate_embedding: { processed: 0, succeeded: 0, failed: 0 },
  }

  try {
    // Log job run start
    const { data: jobRun } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'process_ai_jobs',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    const jobRunId = jobRun?.id
    const timeoutBuffer = env.JOB_TIMEOUT_BUFFER_MS
    const maxDurationMs = (maxDuration || 300) * 1000
    
    // Detect base URL from request (handles port changes during dev)
    const requestUrl = new URL(request.url)
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`

    // Process jobs in order - fetch_transcript → summarize → score → embed
    for (const jobType of JOB_ORDER) {
      // Check timeout
      const elapsed = Date.now() - startTime
      if (elapsed > maxDurationMs - timeoutBuffer) {
        console.log(`Approaching timeout, stopping AI job processing`)
        break
      }

      // Get batch of pending jobs for this type
      const jobs = await getBatchJobs(jobType, 5)

      for (const job of jobs) {
        // Check timeout again per job
        const jobElapsed = Date.now() - startTime
        if (jobElapsed > maxDurationMs - timeoutBuffer) {
          console.log(`Approaching timeout, stopping at ${jobType}`)
          break
        }

        results[jobType].processed++

        try {
          // Mark job as running
          await markJobRunning(job.id, job.attempts)

          // Call the job processor endpoint
          const endpoint = JOB_ENDPOINTS[jobType]
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.CRON_SECRET}`,
            },
            body: JSON.stringify({
              job_id: job.id,
              ...job.payload,
            }),
          })

          const result = await response.json()

          if (response.ok && result.success) {
            await completeJob(job.id)
            results[jobType].succeeded++
          } else {
            const shouldRetry = job.attempts < (job.max_attempts || 3)
            await markJobFailed(
              job.id,
              result.error || `HTTP ${response.status}`,
              shouldRetry
            )
            results[jobType].failed++
          }
        } catch (error) {
          console.error(`Error processing ${jobType} job ${job.id}:`, error)
          const errorMsg = error instanceof Error ? error.message : String(error)
          const shouldRetry = job.attempts < (job.max_attempts || 3)
          await markJobFailed(job.id, errorMsg, shouldRetry)
          results[jobType].failed++
        }
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
          metadata: results
        })
        .eq('id', jobRunId)
    }

    // Calculate totals
    const totals = {
      processed: Object.values(results).reduce((sum, r) => sum + r.processed, 0),
      succeeded: Object.values(results).reduce((sum, r) => sum + r.succeeded, 0),
      failed: Object.values(results).reduce((sum, r) => sum + r.failed, 0),
    }

    return NextResponse.json({
      success: true,
      ...totals,
      byType: results,
    })
  } catch (error) {
    console.error('AI job processing error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal error',
        byType: results,
      },
      { status: 500 }
    )
  }
}
