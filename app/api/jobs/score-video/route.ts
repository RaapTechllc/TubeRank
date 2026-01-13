import { NextResponse } from 'next/server'
import { enqueueJob } from '@/lib/jobs/queue'
import { scoreVideo } from '@/lib/scoring'
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

    // Get summary
    const { data: summary } = await supabase
      .from('summaries')
      .select('long_summary, key_ideas, action_items, claims_to_verify')
      .eq('video_id', video_id)
      .eq('profile_id', profile_id)
      .single()

    if (!summary?.long_summary) {
      return NextResponse.json({ error: 'No summary available' }, { status: 400 })
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, system_prompt, score_weights')
      .eq('id', profile_id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    // Get video
    const { data: video } = await supabase
      .from('videos')
      .select('duration_seconds')
      .eq('id', video_id)
      .single()

    // Get transcript length
    const { data: transcript } = await supabase
      .from('transcripts')
      .select('content')
      .eq('video_id', video_id)
      .eq('is_active', true)
      .single()

    const transcriptLength = transcript?.content?.split(/\s+/).length || 0

    // Run scoring
    await scoreVideo({
      videoId: video_id,
      profileId: profile_id,
      summary: {
        long_summary: summary.long_summary,
        key_ideas: summary.key_ideas as Array<unknown>,
        action_items: summary.action_items as Array<{ item: string }>,
        claims_to_verify: summary.claims_to_verify as Array<{ status?: string }>,
      },
      profile: {
        name: profile.name,
        system_prompt: profile.system_prompt,
        score_weights: profile.score_weights,
      },
      video: {
        duration_seconds: video?.duration_seconds || null,
      },
      transcriptLength,
    })

    // Queue embedding generation
    await enqueueJob('generate_embedding', {
      video_id: video_id,
      profile_id: profile_id,
    })

    return NextResponse.json({ success: true, job_id })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
