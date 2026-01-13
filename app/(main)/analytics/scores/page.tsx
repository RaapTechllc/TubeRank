'use client'

import { AnalyticsLayout } from '@/components/analytics/AnalyticsLayout'
import { AnalyticsGrid, GridItem } from '@/components/analytics/AnalyticsGrid'
import { AnalyticsSection } from '@/components/analytics/AnalyticsSection'
import { StatCard, StatCardSkeleton } from '@/components/analytics/StatCard'
import { FilterBar } from '@/components/analytics/FilterBar'
import { ScoreHistogram, ScoreHistogramSkeleton } from '@/components/analytics/charts/ScoreHistogram'
import { ScoreRadarChart, ScoreRadarChartSkeleton } from '@/components/analytics/charts/RadarChart'
import { useScoreDistribution } from '@/lib/hooks/use-analytics'
import { useAnalyticsStore } from '@/lib/stores/analytics-store'
import { Target, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const DIMENSION_TABS = [
  { value: 'overall', label: 'Overall' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'novelty', label: 'Novelty' },
  { value: 'actionability', label: 'Actionability' },
  { value: 'credibility', label: 'Credibility' },
  { value: 'efficiency', label: 'Efficiency' },
] as const

export default function ScoresAnalyticsPage() {
  const { filters, setScoreDimension } = useAnalyticsStore()
  const { data, isLoading, isError } = useScoreDistribution(
    filters.profileId || undefined,
    filters.scoreDimension
  )

  if (isError) {
    return (
      <AnalyticsLayout title="Score Analysis">
        <div className="editorial-card p-8 text-center">
          <p className="text-[var(--chart-5)]">Failed to load score data.</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Please try again later.
          </p>
        </div>
      </AnalyticsLayout>
    )
  }

  return (
    <AnalyticsLayout
      title="Score Analysis"
      description="Understand how your videos are being scored across different dimensions."
    >
      {/* Filter Bar */}
      <FilterBar className="mb-8" showDateRange={false} />

      {/* Dimension Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b border-[var(--border)] overflow-x-auto">
        {DIMENSION_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setScoreDimension(value)}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap',
              'hover:text-[var(--primary)]',
              filters.scoreDimension === value
                ? 'text-[var(--primary)]'
                : 'text-[var(--muted-foreground)]'
            )}
          >
            {label}
            {filters.scoreDimension === value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
            )}
          </button>
        ))}
      </div>

      {/* Statistics Summary */}
      <AnalyticsSection title="Statistics">
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
                label="Mean Score"
                value={data?.stats.mean || 0}
                icon={<Target className="h-5 w-5" />}
              />
              <StatCard
                label="Median Score"
                value={data?.stats.median || 0}
                icon={<BarChart3 className="h-5 w-5" />}
              />
              <StatCard
                label="Highest Score"
                value={data?.stats.max || 0}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <StatCard
                label="Lowest Score"
                value={data?.stats.min || 0}
                icon={<TrendingDown className="h-5 w-5" />}
              />
            </>
          )}
        </AnalyticsGrid>
      </AnalyticsSection>

      {/* Charts Row */}
      <AnalyticsGrid columns={2} className="mt-8">
        {/* Histogram */}
        <GridItem span={1}>
          <AnalyticsSection
            title={`${DIMENSION_TABS.find(t => t.value === filters.scoreDimension)?.label} Score Distribution`}
          >
            {isLoading ? (
              <ScoreHistogramSkeleton />
            ) : data?.histogram && data.histogram.length > 0 ? (
              <ScoreHistogram
                data={data.histogram}
                stats={data.stats}
                height={350}
              />
            ) : (
              <div className="chart-container h-[350px] flex items-center justify-center">
                <p className="text-[var(--muted-foreground)]">No score data available.</p>
              </div>
            )}
          </AnalyticsSection>
        </GridItem>

        {/* Radar Chart */}
        <GridItem span={1}>
          <AnalyticsSection title="Multi-Dimensional View">
            {isLoading ? (
              <ScoreRadarChartSkeleton />
            ) : data?.radar && data.radar.length > 0 ? (
              <ScoreRadarChart data={data.radar} height={350} />
            ) : (
              <div className="chart-container h-[350px] flex items-center justify-center">
                <p className="text-[var(--muted-foreground)]">No dimension data available.</p>
              </div>
            )}
          </AnalyticsSection>
        </GridItem>
      </AnalyticsGrid>

      {/* Quartile Analysis */}
      {data?.stats && data.stats.count > 0 && (
        <AnalyticsSection title="Quartile Analysis" className="mt-8">
          <div className="editorial-card p-6">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <span className="block text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                  Min
                </span>
                <span className="text-2xl font-bold text-data">{data.stats.min}</span>
              </div>
              <div>
                <span className="block text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                  Q1 (25%)
                </span>
                <span className="text-2xl font-bold text-data">{data.stats.q1}</span>
              </div>
              <div className="bg-[var(--muted)] -mx-4 -my-2 py-2 rounded">
                <span className="block text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                  Median
                </span>
                <span className="text-2xl font-bold text-data text-[var(--primary)]">{data.stats.median}</span>
              </div>
              <div>
                <span className="block text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                  Q3 (75%)
                </span>
                <span className="text-2xl font-bold text-data">{data.stats.q3}</span>
              </div>
              <div>
                <span className="block text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                  Max
                </span>
                <span className="text-2xl font-bold text-data">{data.stats.max}</span>
              </div>
            </div>

            {/* Visual quartile bar */}
            <div className="mt-6 h-4 bg-[var(--muted)] rounded-full overflow-hidden relative">
              <div
                className="absolute h-full bg-[var(--chart-1)] opacity-30"
                style={{
                  left: `${data.stats.min}%`,
                  width: `${data.stats.q1 - data.stats.min}%`
                }}
              />
              <div
                className="absolute h-full bg-[var(--chart-1)] opacity-50"
                style={{
                  left: `${data.stats.q1}%`,
                  width: `${data.stats.median - data.stats.q1}%`
                }}
              />
              <div
                className="absolute h-full bg-[var(--chart-1)] opacity-70"
                style={{
                  left: `${data.stats.median}%`,
                  width: `${data.stats.q3 - data.stats.median}%`
                }}
              />
              <div
                className="absolute h-full bg-[var(--chart-1)]"
                style={{
                  left: `${data.stats.q3}%`,
                  width: `${data.stats.max - data.stats.q3}%`
                }}
              />
              {/* Median marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[var(--primary)]"
                style={{ left: `${data.stats.median}%` }}
              />
            </div>

            <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
              Based on <span className="font-medium">{data.stats.count}</span> scored videos
              {data.stats.stdDev > 0 && (
                <> with a standard deviation of <span className="font-medium">{data.stats.stdDev}</span></>
              )}
            </div>
          </div>
        </AnalyticsSection>
      )}
    </AnalyticsLayout>
  )
}
