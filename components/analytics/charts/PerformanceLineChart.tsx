'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { PerformanceDataPoint } from '@/lib/hooks/use-analytics'

interface PerformanceLineChartProps {
  data: PerformanceDataPoint[]
  metrics?: Array<'views' | 'likes' | 'comments' | 'avgScore'>
  height?: number
}

const METRIC_CONFIG = {
  views: {
    color: 'var(--chart-1)',
    name: 'Views',
  },
  likes: {
    color: 'var(--chart-2)',
    name: 'Likes',
  },
  comments: {
    color: 'var(--chart-3)',
    name: 'Comments',
  },
  avgScore: {
    color: 'var(--chart-4)',
    name: 'Avg Score',
  },
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const date = parseISO(label)
  const formattedDate = format(date, 'MMM d, yyyy')

  return (
    <div className="editorial-card p-3 text-sm">
      <p className="font-semibold text-[var(--foreground)] mb-2">{formattedDate}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[var(--muted-foreground)]">{entry.name}</span>
            </div>
            <span className="font-medium text-[var(--foreground)] text-data">
              {typeof entry.value === 'number'
                ? entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PerformanceLineChart({
  data,
  metrics = ['views', 'avgScore'],
  height = 400,
}: PerformanceLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[var(--muted-foreground)]"
        style={{ height }}
      >
        No data available
      </div>
    )
  }

  // Format dates for display
  const formattedData = data.map(point => ({
    ...point,
    formattedDate: format(parseISO(point.date), 'MMM d'),
  }))

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
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
            tickFormatter={(value: number) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px',
            }}
          />

          {metrics.map((metric) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              name={METRIC_CONFIG[metric].name}
              stroke={METRIC_CONFIG[metric].color}
              strokeWidth={2}
              dot={{ fill: METRIC_CONFIG[metric].color, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Skeleton loading state
export function PerformanceLineChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div className="chart-container" style={{ height }}>
      <div className="animate-pulse h-full flex flex-col">
        <div className="flex-1 bg-[var(--muted)] rounded" />
        <div className="mt-4 flex justify-center gap-4">
          <div className="h-4 w-20 bg-[var(--muted)] rounded" />
          <div className="h-4 w-20 bg-[var(--muted)] rounded" />
        </div>
      </div>
    </div>
  )
}
