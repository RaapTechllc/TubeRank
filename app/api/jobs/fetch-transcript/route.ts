import { NextResponse } from 'next/server'
import { enqueueJob } from '@/lib/jobs/queue'
import { fetchTranscript, TranscriptError } from '@/lib/transcripts'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get payload from request body (sent by process-ai-jobs cron)
  const body = await request.json()
  const { job_id, video_id, youtube_id, language = 'en' } = body as {
    job_id: string
    video_id: string
    youtube_id: string
    language?: string
  }

  if (!video_id || !youtube_id) {
    return NextResponse.json({ error: 'Missing video_id or youtube_id' }, { status: 400 })
  }

  try {
    const transcript = await fetchTranscript(youtube_id, language)
    const supabase = createServerClient()

    // Store transcript
    await supabase
      .from('transcripts')
      .upsert({
        video_id: video_id,
        source: 'fetcher',
        status: 'available',
        content: transcript.fullText,
        language: transcript.language,
        confidence: 100,
        is_active: true,
      }, { onConflict: 'video_id' })

    // Queue summarization for all profiles that have this video
    const { data: cards } = await supabase
      .from('profile_video_cards')
      .select('profile_id')
      .eq('video_id', video_id)

    if (cards && cards.length > 0) {
      for (const card of cards) {
        await enqueueJob('summarize_video', {
          video_id: video_id,
          profile_id: card.profile_id,
        })
      }
    }

    return NextResponse.json({ success: true, job_id })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    // Handle no transcript gracefully - mark as 'none' status
    if (error instanceof TranscriptError && error.code === 'NO_TRANSCRIPT') {
      const supabase = createServerClient()
      
      await supabase
        .from('transcripts')
        .upsert({
          video_id,
          source: 'fetcher',
          status: 'none',
          content: null,
          language: 'en',
          is_active: true,
        }, { onConflict: 'video_id' })
      
      return NextResponse.json({ success: true, no_transcript: true, job_id })
    }

    return NextResponse.json({ error: `Failed to fetch transcript: ${errorMsg}` }, { status: 500 })
  }
}
