import { NextResponse } from 'next/server'
import { enqueueJob } from '@/lib/jobs/queue'
import { summarizeVideo } from '@/lib/summarize'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { job_id, video_id, profile_id } = body as {
    job_id: string
    video_id: string
    profile_id: string
  }

  if (!video_id || !profile_id) {
    return NextResponse.json({ error: 'Missing video_id or profile_id' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    // Get transcript
    const { data: transcript } = await supabase
      .from('transcripts')
      .select('content')
      .eq('video_id', video_id)
      .eq('is_active', true)
      .single()

    if (!transcript?.content) {
      return NextResponse.json({ error: 'No transcript available' }, { status: 400 })
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, system_prompt')
      .eq('id', profile_id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    // Run summarization
    await summarizeVideo({
      videoId: video_id,
      profileId: profile_id,
      transcript: transcript.content,
      profileName: profile.name,
      systemPrompt: profile.system_prompt,
    })

    // Queue scoring
    await enqueueJob('score_video', {
      video_id: video_id,
      profile_id: profile_id,
    })

    return NextResponse.json({ success: true, job_id })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
