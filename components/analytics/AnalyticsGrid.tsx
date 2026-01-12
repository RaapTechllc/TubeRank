'use client'

import { cn } from '@/lib/utils'

interface AnalyticsGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  12: 'grid-cols-12',
}

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
}

export function AnalyticsGrid({
  children,
  columns = 4,
  gap = 'md',
  className,
}: AnalyticsGridProps) {
  return (
    <div
      className={cn(
        'grid',
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

// Grid item with span control
interface GridItemProps {
  children: React.ReactNode
  span?: 1 | 2 | 3 | 4 | 6 | 12
  className?: string
}

const spanClasses = {
  1: 'col-span-1',
  2: 'col-span-1 md:col-span-2',
  3: 'col-span-1 md:col-span-2 lg:col-span-3',
  4: 'col-span-1 md:col-span-2 lg:col-span-4',
  6: 'col-span-1 md:col-span-3 lg:col-span-6',
  12: 'col-span-12',
}

export function GridItem({ children, span = 1, className }: GridItemProps) {
  return (
    <div className={cn(spanClasses[span], className)}>
      {children}
    </div>
  )
}
