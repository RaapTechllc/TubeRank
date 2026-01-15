'use client'

import { AnalyticsLayout } from '@/components/analytics/AnalyticsLayout'
import { AnalyticsGrid } from '@/components/analytics/AnalyticsGrid'
import { AnalyticsSection } from '@/components/analytics/AnalyticsSection'
import { StatCard, StatCardSkeleton } from '@/components/analytics/StatCard'
import { FilterBar } from '@/components/analytics/FilterBar'
import { TrendSparkline } from '@/components/analytics/charts/TrendSparkline'
import { useVelocityData } from '@/lib/hooks/use-analytics'
import { useAnalyticsStore } from '@/lib/stores/analytics-store'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { Inbox, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'

const PIE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="editorial-card p-3 text-sm">
      <p className="font-semibold text-[var(--foreground)] mb-2">
        {format(parseISO(label), 'MMM d, yyyy')}
      </p>
      <div className="space-y-1">
        {payload.map((entry: { value: number; name: string; color: string }, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted-foreground)]">{entry.name}</span>
            <span className="font-medium text-[var(--foreground)] text-data">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VelocityAnalyticsPage() {
  const { filters, setVelocityGroupBy } = useAnalyticsStore()

  // Calculate days based on date range
  const days = filters.dateRange === '7d' ? 7 :
    filters.dateRange === '90d' ? 90 :
    filters.dateRange === '1y' ? 365 : 30

  const { data, isLoading, isError } = useVelocityData(
    filters.profileId || undefined,
    filters.velocityGroupBy,
    days
  )

  if (isError) {
    return (
      <AnalyticsLayout title="Content Velocity">
        <div className="editorial-card p-8 text-center">
          <p className="text-[var(--chart-5)]">Failed to load velocity data.</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Please try again later.
          </p>
        </div>
      </AnalyticsLayout>
    )
  }

  const formattedData = data?.data.map(point => ({
    ...point,
    formattedDate: format(parseISO(point.date), 'MMM d'),
  })) || []

  return (
    <AnalyticsLayout
      title="Content Velocity"
      description="Track how quickly content is being ingested and processed."
    >
      {/* Filter Bar */}
      <FilterBar className="mb-8" />

      {/* Group By Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-[var(--muted-foreground)]">Group by:</span>
        {(['day', 'week', 'month'] as const).map((groupBy) => (
          <button
            key={groupBy}
            onClick={() => setVelocityGroupBy(groupBy)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filters.velocityGroupBy === groupBy
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
          </button>
        ))}
      </div>

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
                label="Total Ingested"
                value={data?.summary.totalIngested || 0}
                change={data?.summary.trend}
                changeLabel="vs prev period"
                icon={<Inbox className="h-5 w-5" />}
                sparkline={
                  data?.data && data.data.length > 0 ? (
                    <TrendSparkline
                      data={data.data.map(d => d.count)}
                      trend={
                        (data.summary.trend || 0) > 0 ? 'up' :
                        (data.summary.trend || 0) < 0 ? 'down' : 'neutral'
                      }
                    />
                  ) : undefined
                }
              />
              <StatCard
                label="Avg/Day"
                value={data?.summary.avgPerDay || 0}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <StatCard
                label="Avg Processing Time"
                value={data?.processing.avgProcessingTime || 0}
                format="duration"
                icon={<Clock className="h-5 w-5" />}
              />
              <StatCard
                label="Success Rate"
                value={
                  data?.processing.completedCount && (data.processing.completedCount + data.processing.failedCount) > 0
                    ? Math.round(
                        (data.processing.completedCount /
                          (data.processing.completedCount + data.processing.failedCount)) *
                          100
                      )
                    : 100
                }
                format="percentage"
                icon={<CheckCircle className="h-5 w-5" />}
              />
            </>
          )}
        </AnalyticsGrid>
      </AnalyticsSection>

      {/* Ingestion Chart */}
      <AnalyticsSection
        title="Content Ingestion Over Time"
        description="Number of videos added to your profiles."
      >
        {isLoading ? (
          <div className="chart-container h-[350px] flex items-center justify-center">
            <div className="skeleton-editorial w-full h-full" />
          </div>
        ) : formattedData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={formattedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="formattedDate"
                  stroke="var(--muted-foreground)"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickLine={{ stroke: 'var(--border)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickLine={{ stroke: 'var(--border)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Videos"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#velocityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-container h-[350px] flex items-center justify-center">
            <p className="text-[var(--muted-foreground)]">No velocity data available for this period.</p>
          </div>
        )}
      </AnalyticsSection>

      {/* Source Breakdown & Processing Status */}
      <AnalyticsGrid columns={2} className="mt-8">
        {/* Source Breakdown */}
        <AnalyticsSection title="Source Breakdown">
          {isLoading ? (
            <div className="chart-container h-[250px] flex items-center justify-center">
              <div className="skeleton-editorial w-32 h-32 rounded-full" />
            </div>
          ) : data?.sourceBreakdown && data.sourceBreakdown.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.sourceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="source"
                  >
                    {data.sourceBreakdown.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} sources`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {data.sourceBreakdown.map((item, index) => (
                  <div key={item.source} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-[var(--muted-foreground)]">{item.source}</span>
                    <span className="font-medium text-data">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chart-container h-[250px] flex items-center justify-center">
              <p className="text-[var(--muted-foreground)]">No source data available.</p>
            </div>
          )}
        </AnalyticsSection>

        {/* Processing Status */}
        <AnalyticsSection title="Processing Status">
          <div className="editorial-card p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-[var(--chart-2)]" />
                  <span>Completed</span>
                </div>
                <span className="text-data font-semibold">
                  {data?.processing.completedCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[var(--chart-3)]" />
                  <span>Pending</span>
                </div>
                <span className="text-data font-semibold">
                  {data?.processing.pendingCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-[var(--chart-5)]" />
                  <span>Failed</span>
                </div>
                <span className="text-data font-semibold">
                  {data?.processing.failedCount || 0}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <div className="text-sm text-[var(--muted-foreground)] mb-2">
                Processing Time
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-[var(--muted-foreground)]">Average</span>
                  <span className="text-xl font-bold text-data">
                    {data?.processing.avgProcessingTime || 0}s
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-[var(--muted-foreground)]">P95</span>
                  <span className="text-xl font-bold text-data">
                    {data?.processing.p95ProcessingTime || 0}s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnalyticsSection>
      </AnalyticsGrid>
    </AnalyticsLayout>
  )
}
