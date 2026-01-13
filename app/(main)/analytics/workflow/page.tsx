'use client'

import { AnalyticsLayout } from '@/components/analytics/AnalyticsLayout'
import { AnalyticsGrid } from '@/components/analytics/AnalyticsGrid'
import { AnalyticsSection } from '@/components/analytics/AnalyticsSection'
import { StatCard, StatCardSkeleton } from '@/components/analytics/StatCard'
import { FilterBar } from '@/components/analytics/FilterBar'
import { useWorkflowFunnel } from '@/lib/hooks/use-analytics'
import { useAnalyticsStore } from '@/lib/stores/analytics-store'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Inbox, Star, Eye, Play, Archive, ArrowRight, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGE_ICONS = {
  inbox: Inbox,
  recommended: Star,
  skim: Eye,
  watch: Play,
  archived: Archive,
}

const STAGE_COLORS = {
  inbox: 'var(--chart-1)',
  recommended: 'var(--chart-4)',
  skim: 'var(--chart-3)',
  watch: 'var(--chart-2)',
  archived: 'var(--muted-foreground)',
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="editorial-card p-3 text-sm">
      <p className="font-semibold text-[var(--foreground)] mb-2">{data.label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--muted-foreground)]">Count</span>
          <span className="font-medium text-[var(--foreground)] text-data">
            {data.count}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--muted-foreground)]">Percentage</span>
          <span className="font-medium text-[var(--foreground)] text-data">
            {data.percentage}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--muted-foreground)]">Avg Time</span>
          <span className="font-medium text-[var(--foreground)] text-data">
            {data.avgTimeInStage}h
          </span>
        </div>
      </div>
    </div>
  )
}

export default function WorkflowAnalyticsPage() {
  const { filters } = useAnalyticsStore()

  const days = filters.dateRange === '7d' ? 7 :
    filters.dateRange === '90d' ? 90 :
    filters.dateRange === '1y' ? 365 : 30

  const { data, isLoading, isError } = useWorkflowFunnel(
    filters.profileId || undefined,
    days
  )

  if (isError) {
    return (
      <AnalyticsLayout title="Workflow Funnel">
        <div className="editorial-card p-8 text-center">
          <p className="text-[var(--chart-5)]">Failed to load workflow data.</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Please try again later.
          </p>
        </div>
      </AnalyticsLayout>
    )
  }

  return (
    <AnalyticsLayout
      title="Workflow Funnel"
      description="Analyze how content moves through your review workflow."
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
                label="Total Cards"
                value={data?.summary.totalCards || 0}
                icon={<Inbox className="h-5 w-5" />}
              />
              <StatCard
                label="Completion Rate"
                value={data?.summary.completionRate || 0}
                format="percentage"
                icon={<CheckCircle className="h-5 w-5" />}
              />
              <StatCard
                label="Avg Time to Complete"
                value={data?.summary.avgTimeToComplete || 0}
                format="duration"
                icon={<Clock className="h-5 w-5" />}
              />
              <StatCard
                label="Most Active Stage"
                value={data?.summary.mostActiveStage || 'N/A'}
                icon={<Star className="h-5 w-5" />}
              />
            </>
          )}
        </AnalyticsGrid>
      </AnalyticsSection>

      {/* Visual Funnel */}
      <AnalyticsSection
        title="Workflow Stages"
        description="Distribution of content across workflow stages."
      >
        {isLoading ? (
          <div className="editorial-card p-8">
            <div className="flex justify-between items-end h-48 gap-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 skeleton-editorial rounded"
                  style={{ height: `${80 - i * 12}%` }}
                />
              ))}
            </div>
          </div>
        ) : data?.funnel && data.funnel.length > 0 ? (
          <div className="editorial-card p-6">
            {/* Stage Cards */}
            <div className="flex items-stretch gap-2">
              {data.funnel.map((stage, index) => {
                const Icon = STAGE_ICONS[stage.stage]
                const color = STAGE_COLORS[stage.stage]
                const isLast = index === data.funnel.length - 1

                return (
                  <div key={stage.stage} className="flex items-center flex-1">
                    <div
                      className={cn(
                        'flex-1 p-4 rounded border border-[var(--border)] transition-colors',
                        'hover:border-[var(--foreground)]'
                      )}
                      style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="h-4 w-4" style={{ color }} />
                        <span className="text-sm font-medium">{stage.label}</span>
                      </div>
                      <div className="text-3xl font-bold text-data mb-1">
                        {stage.count}
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        {stage.percentage}% of total
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-2">
                        Avg: {stage.avgTimeInStage}h
                      </div>
                    </div>
                    {!isLast && (
                      <ArrowRight className="h-5 w-5 text-[var(--muted-foreground)] mx-2 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Bar Chart */}
            <div className="mt-8">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={data.funnel}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
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
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.funnel.map((entry) => (
                      <Cell
                        key={`cell-${entry.stage}`}
                        fill={STAGE_COLORS[entry.stage]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="editorial-card h-[300px] flex items-center justify-center">
            <p className="text-[var(--muted-foreground)]">No workflow data available.</p>
          </div>
        )}
      </AnalyticsSection>

      {/* Conversion Rates */}
      {data?.conversions && data.conversions.length > 0 && (
        <AnalyticsSection title="Conversion Rates">
          <div className="editorial-card overflow-hidden">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Transition</th>
                  <th className="text-right">Converted</th>
                  <th className="text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.conversions.map((conversion, index) => (
                  <tr key={index}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{conversion.from}</span>
                        <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                        <span className="font-medium">{conversion.to}</span>
                      </div>
                    </td>
                    <td className="text-right text-data">{conversion.count}</td>
                    <td className="text-right">
                      <span
                        className={cn(
                          'text-data font-medium px-2 py-0.5 rounded',
                          conversion.rate >= 50 && 'bg-[var(--chart-2)]/10 text-[var(--chart-2)]',
                          conversion.rate >= 25 && conversion.rate < 50 && 'bg-[var(--chart-3)]/10 text-[var(--chart-3)]',
                          conversion.rate < 25 && 'bg-[var(--chart-5)]/10 text-[var(--chart-5)]'
                        )}
                      >
                        {conversion.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnalyticsSection>
      )}

      {/* Stage Time Analysis */}
      {data?.funnel && data.funnel.length > 0 && (
        <AnalyticsSection
          title="Time in Stage"
          description="Average time content spends in each workflow stage."
        >
          <div className="editorial-card p-6">
            <div className="space-y-4">
              {data.funnel.map((stage) => {
                const maxTime = Math.max(...data.funnel.map(s => s.avgTimeInStage))
                const percentage = maxTime > 0 ? (stage.avgTimeInStage / maxTime) * 100 : 0

                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{stage.label}</span>
                      <span className="text-sm text-data">{stage.avgTimeInStage}h</span>
                    </div>
                    <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: STAGE_COLORS[stage.stage],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </AnalyticsSection>
      )}
    </AnalyticsLayout>
  )
}
