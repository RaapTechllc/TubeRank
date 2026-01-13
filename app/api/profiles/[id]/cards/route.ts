import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils/validation'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const { id } = await params

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Support selective field fetching via fields query parameter
  const url = new URL(request.url)
  const fieldsParam = url.searchParams.get('fields')

  let selectQuery = `
    id,
    profile_id,
    video_id,
    column_status,
    position,
    created_at,
    updated_at
  `

  if (fieldsParam) {
    const requestedFields = fieldsParam.split(',')
    if (requestedFields.includes('video')) {
      selectQuery += `,
        video:videos(
          id,
          youtube_id,
          title,
          thumbnail_url,
          channel_name,
          published_at,
          duration_seconds,
          view_count,
          like_count,
          comment_count
        )
      `
    }
    if (requestedFields.includes('score')) {
      selectQuery += `,
        score:scores(
          id,
          overall_score,
          relevance_score,
          novelty_score,
          actionability_score,
          credibility_score,
          efficiency_score
        )
      `
    }
    if (requestedFields.includes('summary')) {
      selectQuery += `,
        summary:summaries(
          id,
          short_summary,
          long_summary,
          key_ideas,
          action_items,
          summary_confidence
        )
      `
    }
  } else {
    // Default: fetch all fields
    selectQuery = `
      *,
      video:videos(*),
      score:scores(*),
      summary:summaries(*)
    `
  }

  const { data, error } = await supabase
    .from('profile_video_cards')
    .select(selectQuery)
    .eq('profile_id', id)
    .order('position', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten nested arrays to single objects (first match for this profile)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cards = (data as any[]).map((card: any) => ({
    ...card,
    score: Array.isArray(card.score) ? card.score[0] : card.score,
    summary: Array.isArray(card.summary) ? card.summary[0] : card.summary,
  }))

  return NextResponse.json(cards)
}
