'use client'

import { AnalyticsLayout } from '@/components/analytics/AnalyticsLayout'
import { AnalyticsGrid } from '@/components/analytics/AnalyticsGrid'
import { AnalyticsSection } from '@/components/analytics/AnalyticsSection'
import { StatCard, StatCardSkeleton } from '@/components/analytics/StatCard'
import { FilterBar } from '@/components/analytics/FilterBar'
import { PerformanceLineChart, PerformanceLineChartSkeleton } from '@/components/analytics/charts/PerformanceLineChart'
import { TrendSparkline } from '@/components/analytics/charts/TrendSparkline'
import { usePerformanceData } from '@/lib/hooks/use-analytics'
import { useAnalyticsStore } from '@/lib/stores/analytics-store'
import { Eye, ThumbsUp, MessageSquare, TrendingUp } from 'lucide-react'

export default function PerformanceAnalyticsPage() {
  const { filters } = useAnalyticsStore()
  const { data, isLoading, isError } = usePerformanceData(
    filters.profileId || undefined,
    filters.dateRange
  )

  if (isError) {
    return (
      <AnalyticsLayout title="Performance Analytics">
        <div className="editorial-card p-8 text-center">
          <p className="text-[var(--chart-5)]">Failed to load performance data.</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Please try again later.
          </p>
        </div>
      </AnalyticsLayout>
    )
  }

  return (
    <AnalyticsLayout
      title="Performance Analytics"
      description="Track views, engagement metrics, and content performance trends over time."
    >
      {/* Filter Bar */}
      <FilterBar className="mb-8" />

      {/* Summary Stats */}
      <AnalyticsSection title="Summary">
        <AnalyticsGrid columns={4}>
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label="Total Views"
                value={data?.summary.totalViews || 0}
                change={data?.summary.viewsChange}
                changeLabel="vs prev period"
                icon={<Eye className="h-5 w-5" />}
                sparkline={
                  data?.data && data.data.length > 0 ? (
                    <TrendSparkline
                      data={data.data.map(d => d.views)}
                      trend={
                        (data.summary.viewsChange || 0) > 0 ? 'up' :
                        (data.summary.viewsChange || 0) < 0 ? 'down' : 'neutral'
                      }
                    />
                  ) : undefined
                }
              />
              <StatCard
                label="Total Likes"
                value={data?.summary.totalLikes || 0}
                icon={<ThumbsUp className="h-5 w-5" />}
                sparkline={
                  data?.data && data.data.length > 0 ? (
                    <TrendSparkline
                      data={data.data.map(d => d.likes)}
                      color="var(--chart-2)"
                    />
                  ) : undefined
                }
              />
              <StatCard
                label="Total Comments"
                value={data?.summary.totalComments || 0}
                icon={<MessageSquare className="h-5 w-5" />}
                sparkline={
                  data?.data && data.data.length > 0 ? (
                    <TrendSparkline
                      data={data.data.map(d => d.comments)}
                      color="var(--chart-3)"
                    />
                  ) : undefined
                }
              />
              <StatCard
                label="Average Score"
                value={data?.summary.avgScore || 0}
                change={data?.summary.scoreChange}
                changeLabel="vs prev period"
                icon={<TrendingUp className="h-5 w-5" />}
                sparkline={
                  data?.data && data.data.length > 0 ? (
                    <TrendSparkline
                      data={data.data.map(d => d.avgScore)}
                      color="var(--chart-4)"
                    />
                  ) : undefined
                }
              />
            </>
          )}
        </AnalyticsGrid>
      </AnalyticsSection>

      {/* Views & Engagement Chart */}
      <AnalyticsSection
        title="Views & Engagement Over Time"
        description="Daily breakdown of views, likes, and comments."
      >
        {isLoading ? (
          <PerformanceLineChartSkeleton />
        ) : data?.data && data.data.length > 0 ? (
          <PerformanceLineChart
            data={data.data}
            metrics={['views', 'likes', 'comments']}
            height={400}
          />
        ) : (
          <div className="chart-container h-[400px] flex items-center justify-center">
            <p className="text-[var(--muted-foreground)]">No performance data available for this period.</p>
          </div>
        )}
      </AnalyticsSection>

      {/* Score Trend Chart */}
      <AnalyticsSection
        title="Score Trend"
        description="Average video score over time."
      >
        {isLoading ? (
          <PerformanceLineChartSkeleton height={300} />
        ) : data?.data && data.data.length > 0 ? (
          <PerformanceLineChart
            data={data.data}
            metrics={['avgScore']}
            height={300}
          />
        ) : (
          <div className="chart-container h-[300px] flex items-center justify-center">
            <p className="text-[var(--muted-foreground)]">No score data available for this period.</p>
          </div>
        )}
      </AnalyticsSection>

      {/* Daily Breakdown Table */}
      {data?.data && data.data.length > 0 && (
        <AnalyticsSection
          title="Daily Breakdown"
          collapsible
          defaultExpanded={false}
        >
          <div className="editorial-card overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="editorial-table">
                <thead className="sticky top-0 bg-[var(--muted)]">
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Videos</th>
                    <th className="text-right">Views</th>
                    <th className="text-right">Likes</th>
                    <th className="text-right">Comments</th>
                    <th className="text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice().reverse().map((day, index) => (
                    <tr key={index}>
                      <td className="font-medium">{day.date}</td>
                      <td className="text-right text-data">{day.videoCount}</td>
                      <td className="text-right text-data">{day.views.toLocaleString()}</td>
                      <td className="text-right text-data">{day.likes.toLocaleString()}</td>
                      <td className="text-right text-data">{day.comments.toLocaleString()}</td>
                      <td className="text-right text-data">{day.avgScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AnalyticsSection>
      )}
    </AnalyticsLayout>
  )
}
