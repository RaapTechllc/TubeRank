import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils/validation'
import { requireAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/rate-limit/middleware'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

type Params = { params: Promise<{ id: string }> }

async function handleGET(request: NextRequest, { params }: Params) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { id } = await params

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  }

  const supabase = createServerClient()

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
    selectQuery = `
      *,
      video:videos(*),
      score:scores(*),
      summary:summaries(*)
    `
  }

  const { data, error: dbError } = await supabase
    .from('profile_video_cards')
    .select(selectQuery)
    .eq('profile_id', id)
    .order('position', { ascending: true })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const cards = (data as any[]).map((card: any) => ({
    ...card,
    score: Array.isArray(card.score) ? card.score[0] : card.score,
    summary: Array.isArray(card.summary) ? card.summary[0] : card.summary,
  }))

  return NextResponse.json(cards)
}

export const GET = withRateLimit(handleGET, RATE_LIMITS.API)