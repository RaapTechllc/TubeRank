import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { subDays, subYears, format, startOfDay, endOfDay } from 'date-fns'

interface PerformanceDataPoint {
  date: string
  views: number
  likes: number
  comments: number
  avgScore: number
  videoCount: number
}

interface PerformanceResponse {
  data: PerformanceDataPoint[]
  summary: {
    totalViews: number
    totalLikes: number
    totalComments: number
    avgScore: number
    totalVideos: number
    viewsChange: number
    scoreChange: number
  }
}

function getDateRange(range: string): { start: Date; end: Date } {
  const end = endOfDay(new Date())
  let start: Date

  switch (range) {
    case '7d':
      start = startOfDay(subDays(new Date(), 7))
      break
    case '30d':
      start = startOfDay(subDays(new Date(), 30))
      break
    case '90d':
      start = startOfDay(subDays(new Date(), 90))
      break
    case '1y':
      start = startOfDay(subYears(new Date(), 1))
      break
    default:
      start = startOfDay(subDays(new Date(), 30))
  }

  return { start, end }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const profileId = searchParams.get('profileId')
  const dateRange = searchParams.get('dateRange') || '30d'

  const supabase = createServerClient()
  const { start, end } = getDateRange(dateRange)

  try {
    // Use optimized RPC function for aggregation
    const { data: summaryData, error: summaryError } = await supabase.rpc('get_performance_summary', {
      p_profile_id: profileId || null,
      p_start_date: start.toISOString(),
      p_end_date: end.toISOString()
    })

    if (summaryError) {
      console.error('Analytics performance summary error:', summaryError)
      return NextResponse.json({ error: summaryError.message }, { status: 500 })
    }

    // Use optimized RPC function for daily data
    const { data: dailyData, error: dailyError } = await supabase.rpc('get_performance_analytics', {
      p_profile_id: profileId || null,
      p_start_date: start.toISOString(),
      p_end_date: end.toISOString()
    })

    if (dailyError) {
      console.error('Analytics performance daily error:', dailyError)
      return NextResponse.json({ error: dailyError.message }, { status: 500 })
    }

    // Format daily data
    const performanceData: PerformanceDataPoint[] = (dailyData || []).map((row: any) => ({
      date: row.date,
      views: Number(row.views),
      likes: Number(row.likes),
      comments: Number(row.comments),
      avgScore: row.avg_score ? Math.round(Number(row.avg_score)) : 0,
      videoCount: Number(row.video_count)
    }))

    // Format summary
    const summary = (summaryData || [])[0] as any
    const response: PerformanceResponse = {
      data: performanceData,
      summary: {
        totalViews: Number(summary?.total_views || 0),
        totalLikes: Number(summary?.total_likes || 0),
        totalComments: Number(summary?.total_comments || 0),
        avgScore: summary?.avg_score ? Math.round(Number(summary.avg_score)) : 0,
        totalVideos: Number(summary?.total_videos || 0),
        viewsChange: Number(summary?.views_change || 0),
        scoreChange: Number(summary?.score_change || 0)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analytics performance error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}
