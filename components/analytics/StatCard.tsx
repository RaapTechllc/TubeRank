'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: ReactNode
  format?: 'number' | 'percentage' | 'currency' | 'duration'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  sparkline?: ReactNode
}

function formatValue(value: string | number, format: StatCardProps['format']): string {
  if (typeof value === 'string') return value

  switch (format) {
    case 'percentage':
      return `${value}%`
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(value)
    case 'duration':
      // Assume value is in seconds
      if (value < 60) return `${value}s`
      if (value < 3600) return `${Math.round(value / 60)}m`
      return `${Math.round(value / 3600)}h`
    case 'number':
    default:
      return new Intl.NumberFormat('en-US', {
        notation: value >= 1000000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
      }).format(value)
  }
}

function TrendIndicator({ change, label }: { change: number; label?: string }) {
  const isPositive = change > 0
  const isNeutral = change === 0
  const Icon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-sm',
        isPositive && 'text-[var(--chart-2)]',
        isNeutral && 'text-[var(--muted-foreground)]',
        !isPositive && !isNeutral && 'text-[var(--chart-5)]'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">
        {isPositive ? '+' : ''}{change}%
      </span>
      {label && (
        <span className="text-[var(--muted-foreground)]">{label}</span>
      )}
    </div>
  )
}

const sizeClasses = {
  sm: {
    container: 'p-4',
    value: 'text-2xl',
    label: 'text-xs',
  },
  md: {
    container: 'p-5',
    value: 'text-3xl',
    label: 'text-sm',
  },
  lg: {
    container: 'p-6',
    value: 'text-4xl',
    label: 'text-base',
  },
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  format = 'number',
  size = 'md',
  className,
  sparkline,
}: StatCardProps) {
  const sizes = sizeClasses[size]

  return (
    <div
      className={cn(
        'editorial-card',
        sizes.container,
        className
      )}
    >
      {/* Header with label and icon */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          'text-[var(--muted-foreground)] font-medium uppercase tracking-wide',
          sizes.label
        )}>
          {label}
        </span>
        {icon && (
          <span className="text-[var(--muted-foreground)]">
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <span className={cn(
            'stat-number block text-[var(--foreground)]',
            sizes.value
          )}>
            {formatValue(value, format)}
          </span>

          {/* Change indicator */}
          {change !== undefined && (
            <div className="mt-2">
              <TrendIndicator change={change} label={changeLabel} />
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparkline && (
          <div className="flex-shrink-0 w-24 h-12">
            {sparkline}
          </div>
        )}
      </div>
    </div>
  )
}

// Skeleton loading state
export function StatCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = sizeClasses[size]

  return (
    <div className={cn('editorial-card', sizes.container)}>
      <div className="skeleton-editorial h-4 w-24 mb-4" />
      <div className="skeleton-editorial h-10 w-32 mb-2" />
      <div className="skeleton-editorial h-4 w-20" />
    </div>
  )
}
