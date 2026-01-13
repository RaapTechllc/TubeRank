'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import type { HistogramBucket, ScoreStats } from '@/lib/hooks/use-analytics'

interface ScoreHistogramProps {
  data: HistogramBucket[]
  stats?: ScoreStats
  height?: number
  showMean?: boolean
  showMedian?: boolean
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload as HistogramBucket

  return (
    <div className="editorial-card p-3 text-sm">
      <p className="font-semibold text-[var(--foreground)] mb-2">
        Score Range: {data.range}
      </p>
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
      </div>
    </div>
  )
}

function getBarColor(min: number): string {
  // Color bars based on score range (green for high, red for low)
  if (min >= 70) return 'var(--chart-2)' // Green
  if (min >= 50) return 'var(--chart-3)' // Amber
  if (min >= 30) return 'var(--chart-1)' // Blue
  return 'var(--chart-5)' // Red
}

export function ScoreHistogram({
  data,
  stats,
  height = 300,
  showMean = true,
  showMedian = true,
}: ScoreHistogramProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[var(--muted-foreground)]"
        style={{ height }}
      >
        No score data available
      </div>
    )
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="range"
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
            label={{
              value: 'Count',
              angle: -90,
              position: 'insideLeft',
              fill: 'var(--muted-foreground)',
              fontSize: 12,
            }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Mean reference line */}
          {showMean && stats?.mean && (
            <ReferenceLine
              x={`${Math.floor(stats.mean / 10) * 10}-${Math.floor(stats.mean / 10) * 10 + 10}`}
              stroke="var(--primary)"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Mean: ${stats.mean}`,
                fill: 'var(--primary)',
                fontSize: 11,
                position: 'top',
              }}
            />
          )}

          {/* Median reference line */}
          {showMedian && stats?.median && stats.median !== stats.mean && (
            <ReferenceLine
              x={`${Math.floor(stats.median / 10) * 10}-${Math.floor(stats.median / 10) * 10 + 10}`}
              stroke="var(--chart-4)"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{
                value: `Median: ${stats.median}`,
                fill: 'var(--chart-4)',
                fontSize: 11,
                position: 'top',
              }}
            />
          )}

          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.min)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stats Summary */}
      {stats && (
        <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <span className="block text-[var(--muted-foreground)]">Mean</span>
            <span className="font-semibold text-data">{stats.mean}</span>
          </div>
          <div>
            <span className="block text-[var(--muted-foreground)]">Median</span>
            <span className="font-semibold text-data">{stats.median}</span>
          </div>
          <div>
            <span className="block text-[var(--muted-foreground)]">Std Dev</span>
            <span className="font-semibold text-data">{stats.stdDev}</span>
          </div>
          <div>
            <span className="block text-[var(--muted-foreground)]">Range</span>
            <span className="font-semibold text-data">{stats.min}-{stats.max}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Skeleton loading state
export function ScoreHistogramSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="chart-container" style={{ height }}>
      <div className="animate-pulse h-full flex flex-col">
        <div className="flex-1 flex items-end gap-2 px-8">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-[var(--muted)] rounded-t"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-3 w-12 bg-[var(--muted)] rounded mb-1" />
              <div className="h-4 w-8 bg-[var(--muted)] rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
