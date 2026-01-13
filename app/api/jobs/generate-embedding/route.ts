import { NextResponse } from 'next/server'
import { storeEmbedding } from '@/lib/embeddings'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

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
      .select('long_summary')
      .eq('video_id', video_id)
      .eq('profile_id', profile_id)
      .single()

    if (!summary?.long_summary) {
      return NextResponse.json({ error: 'No summary available' }, { status: 400 })
    }

    // Generate and store embedding
    await storeEmbedding(video_id, profile_id, summary.long_summary)

    return NextResponse.json({ success: true, job_id })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
