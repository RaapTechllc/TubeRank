import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { format, subDays, subWeeks, subMonths, startOfDay, startOfWeek, startOfMonth } from 'date-fns'

type GroupBy = 'day' | 'week' | 'month'

interface VelocityDataPoint {
  date: string
  count: number
  cumulative: number
}

interface SourceBreakdown {
  source: string
  count: number
  percentage: number
}

interface ProcessingMetrics {
  avgProcessingTime: number
  p95ProcessingTime: number
  pendingCount: number
  failedCount: number
  completedCount: number
}

interface VelocityResponse {
  data: VelocityDataPoint[]
  sourceBreakdown: SourceBreakdown[]
  processing: ProcessingMetrics
  summary: {
    totalIngested: number
    avgPerDay: number
    trend: number // percentage change
  }
}

function getDateKey(date: Date, groupBy: GroupBy): string {
  switch (groupBy) {
    case 'day':
      return format(date, 'yyyy-MM-dd')
    case 'week':
      return format(startOfWeek(date), 'yyyy-MM-dd')
    case 'month':
      return format(startOfMonth(date), 'yyyy-MM')
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const profileId = searchParams.get('profileId')
  const groupBy = (searchParams.get('groupBy') || 'day') as GroupBy
  const days = parseInt(searchParams.get('days') || '30', 10)

  const supabase = createServerClient()
  const startDate = startOfDay(subDays(new Date(), days))

  try {
    // Fetch videos/cards ingested in the time period
    let cardsQuery = supabase
      .from('profile_video_cards')
      .select('id, created_at, profile_id')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (profileId) {
      cardsQuery = cardsQuery.eq('profile_id', profileId)
    }

    const { data: cards, error: cardsError } = await cardsQuery

    if (cardsError) {
      console.error('Analytics velocity cards query error:', cardsError)
      return NextResponse.json({ error: cardsError.message }, { status: 500 })
    }

    // Fetch profile sources for breakdown
    let sourcesQuery = supabase
      .from('profile_sources')
      .select('source_type, profile_id')

    if (profileId) {
      sourcesQuery = sourcesQuery.eq('profile_id', profileId)
    }

    const { data: sources, error: sourcesError } = await sourcesQuery

    if (sourcesError) {
      console.error('Analytics velocity sources query error:', sourcesError)
    }

    // Fetch job queue stats for processing metrics
    const { data: jobs, error: jobsError } = await supabase
      .from('job_queue')
      .select('status, created_at, updated_at')
      .gte('created_at', startDate.toISOString())

    if (jobsError) {
      console.error('Analytics velocity jobs query error:', jobsError)
    }

    // Group cards by date
    const dataByDate = new Map<string, number>()
    for (const card of cards || []) {
      const dateKey = getDateKey(new Date(card.created_at), groupBy)
      dataByDate.set(dateKey, (dataByDate.get(dateKey) || 0) + 1)
    }

    // Convert to array with cumulative counts
    let cumulative = 0
    const velocityData: VelocityDataPoint[] = Array.from(dataByDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => {
        cumulative += count
        return { date, count, cumulative }
      })

    // Calculate source breakdown
    const sourceCounts = new Map<string, number>()
    for (const source of sources || []) {
      const type = source.source_type
      sourceCounts.set(type, (sourceCounts.get(type) || 0) + 1)
    }

    const totalSources = Array.from(sourceCounts.values()).reduce((a, b) => a + b, 0)
    const sourceBreakdown: SourceBreakdown[] = Array.from(sourceCounts.entries())
      .map(([source, count]) => ({
        source: source.charAt(0).toUpperCase() + source.slice(1),
        count,
        percentage: totalSources > 0 ? Math.round((count / totalSources) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate processing metrics
    const pendingCount = jobs?.filter(j => j.status === 'pending').length || 0
    const failedCount = jobs?.filter(j => j.status === 'failed').length || 0
    const completedJobs = jobs?.filter(j => j.status === 'completed') || []
    const completedCount = completedJobs.length

    // Calculate processing times (in seconds)
    const processingTimes = completedJobs
      .map(job => {
        const created = new Date(job.created_at).getTime()
        const updated = new Date(job.updated_at).getTime()
        return (updated - created) / 1000
      })
      .filter(t => t > 0)
      .sort((a, b) => a - b)

    const avgProcessingTime = processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : 0

    const p95Index = Math.floor(processingTimes.length * 0.95)
    const p95ProcessingTime = processingTimes.length > 0
      ? Math.round(processingTimes[p95Index] ?? processingTimes[processingTimes.length - 1] ?? 0)
      : 0

    // Calculate summary
    const totalIngested = cards?.length || 0
    const avgPerDay = Math.round((totalIngested / days) * 10) / 10

    // Trend: compare first half to second half
    const midpoint = Math.floor(velocityData.length / 2)
    const firstHalf = velocityData.slice(0, midpoint)
    const secondHalf = velocityData.slice(midpoint)
    const firstHalfTotal = firstHalf.reduce((sum, d) => sum + d.count, 0)
    const secondHalfTotal = secondHalf.reduce((sum, d) => sum + d.count, 0)
    const trend = firstHalfTotal > 0
      ? Math.round(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100)
      : 0

    const response: VelocityResponse = {
      data: velocityData,
      sourceBreakdown,
      processing: {
        avgProcessingTime,
        p95ProcessingTime,
        pendingCount,
        failedCount,
        completedCount
      },
      summary: {
        totalIngested,
        avgPerDay,
        trend
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analytics velocity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch velocity data' },
      { status: 500 }
    )
  }
}
