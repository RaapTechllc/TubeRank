'use client'

import { useId } from 'react'

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
} from 'recharts'

interface SparklineDataPoint {
  value: number
}

interface TrendSparklineProps {
  data: SparklineDataPoint[] | number[]
  color?: string
  height?: number
  width?: number
  showGradient?: boolean
  trend?: 'up' | 'down' | 'neutral'
}

export function TrendSparkline({
  data,
  color,
  height = 40,
  width = 100,
  showGradient = true,
  trend,
}: TrendSparklineProps) {
  // Generate unique gradient ID (must be before any early returns)
  const gradientId = useId()
  
  // Normalize data to array of objects
  const normalizedData = data.map((d, i) => ({
    index: i,
    value: typeof d === 'number' ? d : d.value,
  }))

  if (normalizedData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[var(--muted-foreground)] text-xs"
        style={{ height, width }}
      >
        --
      </div>
    )
  }

  // Determine color based on trend or use provided color
  const chartColor = color || (
    trend === 'up' ? 'var(--chart-2)' :
    trend === 'down' ? 'var(--chart-5)' :
    'var(--chart-1)'
  )


  return (
    <div style={{ height, width }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={normalizedData}
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          {showGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
          )}
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={1.5}
            fill={showGradient ? `url(#${gradientId})` : 'transparent'}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Simple line sparkline (no fill)
export function LineSparkline({
  data,
  color = 'var(--chart-1)',
  height = 30,
  width = 80,
}: Omit<TrendSparklineProps, 'showGradient' | 'trend'>) {
  const normalizedData = data.map((d, i) => ({
    index: i,
    value: typeof d === 'number' ? d : d.value,
  }))

  if (normalizedData.length === 0) {
    return <div style={{ height, width }} />
  }

  return (
    <div style={{ height, width }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={normalizedData}
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill="transparent"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Skeleton loading state
export function TrendSparklineSkeleton({
  height = 40,
  width = 100,
}: {
  height?: number
  width?: number
}) {
  return (
    <div
      className="skeleton-editorial"
      style={{ height, width }}
    />
  )
}
