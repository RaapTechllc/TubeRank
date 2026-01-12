'use client'

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { RadarData } from '@/lib/hooks/use-analytics'

interface ScoreRadarChartProps {
  data: RadarData[]
  height?: number
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload as RadarData

  return (
    <div className="editorial-card p-3 text-sm">
      <p className="font-semibold text-[var(--foreground)]">{data.dimension}</p>
      <p className="text-[var(--muted-foreground)] mt-1">
        Score: <span className="font-medium text-data text-[var(--foreground)]">{data.value}</span>
        <span className="text-[var(--muted-foreground)]"> / {data.fullMark}</span>
      </p>
    </div>
  )
}

export function ScoreRadarChart({
  data,
  height = 350,
}: ScoreRadarChartProps) {
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
        <RechartsRadar
          data={data}
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
          <PolarGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{
              fill: 'var(--foreground)',
              fontSize: 12,
              fontWeight: 500,
            }}
            tickLine={{ stroke: 'var(--border)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{
              fill: 'var(--muted-foreground)',
              fontSize: 10,
            }}
            tickCount={5}
            stroke="var(--border)"
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: 'var(--chart-1)',
              stroke: 'var(--card)',
              strokeWidth: 2,
            }}
          />
        </RechartsRadar>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-sm">
        {data.map((item) => (
          <div key={item.dimension} className="text-center">
            <span className="block text-[var(--muted-foreground)] text-xs">
              {item.dimension}
            </span>
            <span className="font-semibold text-data">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton loading state
export function ScoreRadarChartSkeleton({ height = 350 }: { height?: number }) {
  return (
    <div className="chart-container" style={{ height }}>
      <div className="animate-pulse h-full flex items-center justify-center">
        <div
          className="w-48 h-48 rounded-full bg-[var(--muted)]"
          style={{
            background: 'conic-gradient(var(--muted) 0deg, var(--muted) 360deg)',
          }}
        />
      </div>
    </div>
  )
}
