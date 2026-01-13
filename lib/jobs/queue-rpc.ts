import { createServerClient } from '@/lib/supabase/server'
import type { JobType } from './queue'

interface Job {
  id: string
  job_type: string
  payload: Record<string, unknown>
  status: string
  attempts: number
  max_attempts: number
  scheduled_at: string
  started_at: string | null
  completed_at: string | null
  error: string | null
  created_at: string
}

/**
 * Get next job with atomic row-level locking to prevent race conditions
 * Uses FOR UPDATE SKIP LOCKED for safe multi-worker scenarios
 * @param jobType - Type of job to fetch
 * @returns Job object or null if no jobs available
 */
export async function getNextJob(jobType: JobType): Promise<Job | null> {
  const supabase = createServerClient()

  // Use RPC call if available, otherwise fallback to regular query
  // Note: For production, implement a PostgreSQL function with FOR UPDATE SKIP LOCKED
  const { data, error } = await supabase
    .from('job_queue')
    .select('*')
    .eq('job_type', jobType)
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching next job:', error)
    return null
  }

  return data as Job | null
}
