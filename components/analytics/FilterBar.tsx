'use client'

import { cn } from '@/lib/utils'
import { Calendar, ChevronDown, RotateCcw } from 'lucide-react'
import { useAnalyticsStore } from '@/lib/stores/analytics-store'
import type { DateRange } from '@/lib/hooks/use-analytics'
import { useProfiles } from '@/lib/hooks/use-profiles'

interface FilterBarProps {
  className?: string
  showProfileFilter?: boolean
  showDateRange?: boolean
  onReset?: () => void
}

const DATE_RANGE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
]

export function FilterBar({
  className,
  showProfileFilter = true,
  showDateRange = true,
  onReset,
}: FilterBarProps) {
  const {
    filters,
    setDateRange,
    setProfileId,
    resetFilters,
  } = useAnalyticsStore()

  const { data: profiles } = useProfiles()

  const handleReset = () => {
    resetFilters()
    onReset?.()
  }

  const selectedDateLabel = DATE_RANGE_OPTIONS.find(
    opt => opt.value === filters.dateRange
  )?.label || 'Select range'

  const selectedProfile = profiles?.find(p => p.id === filters.profileId)

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded',
      className
    )}>
      {/* Date Range Selector */}
      {showDateRange && (
        <div className="relative">
          <label className="sr-only">Date Range</label>
          <div className="relative">
            <select
              value={filters.dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className={cn(
                'appearance-none bg-[var(--background)] border border-[var(--border)] rounded',
                'pl-9 pr-8 py-2 text-sm font-medium',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
                'cursor-pointer transition-colors hover:border-[var(--foreground)]'
              )}
            >
              {DATE_RANGE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
          </div>
        </div>
      )}

      {/* Profile Selector */}
      {showProfileFilter && profiles && profiles.length > 0 && (
        <div className="relative">
          <label className="sr-only">Profile</label>
          <div className="relative">
            <select
              value={filters.profileId || ''}
              onChange={(e) => setProfileId(e.target.value || null)}
              className={cn(
                'appearance-none bg-[var(--background)] border border-[var(--border)] rounded',
                'pl-3 pr-8 py-2 text-sm font-medium min-w-[160px]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
                'cursor-pointer transition-colors hover:border-[var(--foreground)]'
              )}
            >
              <option value="">All Profiles</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm font-medium',
          'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          'transition-colors'
        )}
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </button>
    </div>
  )
}

// Compact version for inline use
export function FilterBarCompact({ className }: { className?: string }) {
  const { filters, setDateRange } = useAnalyticsStore()

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {DATE_RANGE_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setDateRange(value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded transition-colors',
            filters.dateRange === value
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
          )}
        >
          {value}
        </button>
      ))}
    </div>
  )
}
