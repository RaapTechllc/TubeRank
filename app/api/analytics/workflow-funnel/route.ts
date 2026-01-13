import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'
import { requireAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/rate-limit/middleware'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

type ColumnStatus = 'inbox' | 'recommended' | 'skim' | 'watch' | 'archived'

interface FunnelStage {
  stage: ColumnStatus
  label: string
  count: number
  percentage: number
  avgTimeInStage: number // in hours
}

interface FlowData {
  source: string
  target: string
  value: number
}

interface ConversionRate {
  from: string
  to: string
  rate: number
  count: number
}

interface WorkflowFunnelResponse {
  funnel: FunnelStage[]
  flow: FlowData[]
  conversions: ConversionRate[]
  summary: {
    totalCards: number
    completionRate: number // inbox to watch/archived
    avgTimeToComplete: number // hours from inbox to final stage
    mostActiveStage: string
  }
}

const STAGE_ORDER: ColumnStatus[] = ['inbox', 'recommended', 'skim', 'watch', 'archived']

const STAGE_LABELS: Record<ColumnStatus, string> = {
  inbox: 'Inbox',
  recommended: 'Recommended',
  skim: 'Skim',
  watch: 'Watch',
  archived: 'Archived'
}

async function handleGET(request: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const profileId = searchParams.get('profileId')
  const days = parseInt(searchParams.get('days') || '30', 10)

  const supabase = createServerClient()
  const startDate = subDays(new Date(), days)

  try {
    // Fetch all cards with their current status
    let cardsQuery = supabase
      .from('profile_video_cards')
      .select('id, column_status, created_at, updated_at, profile_id')
      .gte('created_at', startDate.toISOString())

    if (profileId) {
      cardsQuery = cardsQuery.eq('profile_id', profileId)
    }

    const { data: cards, error: cardsError } = await cardsQuery

    if (cardsError) {
      console.error('Analytics workflow-funnel cards query error:', cardsError)
      return NextResponse.json({ error: cardsError.message }, { status: 500 })
    }

    if (!cards || cards.length === 0) {
      const emptyResponse: WorkflowFunnelResponse = {
        funnel: STAGE_ORDER.map(stage => ({
          stage,
          label: STAGE_LABELS[stage],
          count: 0,
          percentage: 0,
          avgTimeInStage: 0
        })),
        flow: [],
        conversions: [],
        summary: {
          totalCards: 0,
          completionRate: 0,
          avgTimeToComplete: 0,
          mostActiveStage: 'inbox'
        }
      }
      return NextResponse.json(emptyResponse)
    }

    // Count cards in each stage
    const stageCounts = new Map<ColumnStatus, number>()
    for (const stage of STAGE_ORDER) {
      stageCounts.set(stage, 0)
    }
    for (const card of cards) {
      const status = card.column_status as ColumnStatus
      stageCounts.set(status, (stageCounts.get(status) || 0) + 1)
    }

    const totalCards = cards.length

    // Calculate funnel data
    const funnel: FunnelStage[] = STAGE_ORDER.map(stage => {
      const count = stageCounts.get(stage) || 0

      // Calculate average time in stage (simplified: time from creation to now for current stage)
      const stageCards = cards.filter(c => c.column_status === stage)
      const avgTimeMs = stageCards.length > 0
        ? stageCards.reduce((sum, c) => {
            const created = new Date(c.created_at).getTime()
            const updated = new Date(c.updated_at).getTime()
            return sum + (updated - created)
          }, 0) / stageCards.length
        : 0
      const avgTimeInStage = Math.round(avgTimeMs / (1000 * 60 * 60) * 10) / 10 // hours

      return {
        stage,
        label: STAGE_LABELS[stage],
        count,
        percentage: Math.round((count / totalCards) * 1000) / 10,
        avgTimeInStage
      }
    })

    // Generate Sankey flow data (simplified: assume linear progression)
    // In reality, you'd need to track stage transitions over time
    const flow: FlowData[] = []
    for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
      const currentStage = STAGE_ORDER[i]
      const nextStage = STAGE_ORDER[i + 1]
      if (!currentStage || !nextStage) continue

      // Count cards that have progressed beyond current stage
      const currentCount = stageCounts.get(currentStage) || 0
      const progressedCount = STAGE_ORDER.slice(i + 1)
        .reduce((sum, s) => sum + (stageCounts.get(s) || 0), 0)

      if (progressedCount > 0) {
        flow.push({
          source: STAGE_LABELS[currentStage],
          target: STAGE_LABELS[nextStage],
          value: progressedCount
        })
      }

      // Cards that stayed in current stage
      if (currentCount > 0) {
        flow.push({
          source: STAGE_LABELS[currentStage],
          target: `${STAGE_LABELS[currentStage]} (staying)`,
          value: currentCount
        })
      }
    }

    // Calculate conversion rates between stages
    const conversions: ConversionRate[] = []
    let previousTotal = totalCards

    for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
      const fromStage = STAGE_ORDER[i]
      const toStage = STAGE_ORDER[i + 1]
      if (!fromStage || !toStage) continue

      // Count cards that made it to or past the target stage
      const reachedTarget = STAGE_ORDER.slice(i + 1)
        .reduce((sum, s) => sum + (stageCounts.get(s) || 0), 0)

      const rate = previousTotal > 0
        ? Math.round((reachedTarget / previousTotal) * 1000) / 10
        : 0

      conversions.push({
        from: STAGE_LABELS[fromStage],
        to: STAGE_LABELS[toStage],
        rate,
        count: reachedTarget
      })

      // Update for next iteration
      previousTotal = stageCounts.get(fromStage) || 0
    }

    // Calculate summary statistics
    const watchedCount = stageCounts.get('watch') || 0
    const archivedCount = stageCounts.get('archived') || 0
    const completionRate = totalCards > 0
      ? Math.round(((watchedCount + archivedCount) / totalCards) * 1000) / 10
      : 0

    // Find most active stage (most cards)
    const firstFunnel = funnel[0]
    const mostActiveStage = funnel.reduce((max, stage) =>
      stage.count > max.count ? stage : max
    , firstFunnel ?? { stage: 'inbox' as ColumnStatus, label: 'Inbox', count: 0, percentage: 0, avgTimeInStage: 0 })

    // Average time to complete (from inbox to watch/archived)
    const completedCards = cards.filter(c =>
      c.column_status === 'watch' || c.column_status === 'archived'
    )
    const avgTimeToComplete = completedCards.length > 0
      ? Math.round(
          completedCards.reduce((sum, c) => {
            const created = new Date(c.created_at).getTime()
            const updated = new Date(c.updated_at).getTime()
            return sum + (updated - created)
          }, 0) / completedCards.length / (1000 * 60 * 60) * 10
        ) / 10
      : 0

    const response: WorkflowFunnelResponse = {
      funnel,
      flow,
      conversions,
      summary: {
        totalCards,
        completionRate,
        avgTimeToComplete,
        mostActiveStage: mostActiveStage.label
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analytics workflow-funnel error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow funnel data' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(handleGET, RATE_LIMITS.API)
