import { createServerClient } from '@/lib/supabase/server'

export type JobType = 
  | 'fetch_transcript'
  | 'summarize_video'
  | 'score_video'
  | 'generate_embedding'

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

export async function getNextJob(jobType: JobType) {
  const supabase = createServerClient()
  
  const { data } = await supabase
    .from('job_queue')
    .select()
    .eq('job_type', jobType)
    .eq('status', 'pending')
    .lt('attempts', 3)
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .single()

  if (!data) return null

  await supabase
    .from('job_queue')
    .update({ 
      status: 'running', 
      started_at: new Date().toISOString(),
      attempts: data.attempts + 1
    })
    .eq('id', data.id)

  return data
}

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
