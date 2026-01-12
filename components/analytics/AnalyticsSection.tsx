'use client'

import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface AnalyticsSectionProps {
  children: React.ReactNode
  title: string
  description?: string
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
  headerAction?: React.ReactNode
}

export function AnalyticsSection({
  children,
  title,
  description,
  collapsible = false,
  defaultExpanded = true,
  className,
  headerAction,
}: AnalyticsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <section className={cn('rule-line-sm first:border-t-0 first:mt-0 first:pt-0', className)}>
      {/* Section Header */}
      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 -ml-1 hover:bg-[var(--muted)] rounded transition-colors"
                aria-expanded={isExpanded}
              >
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-[var(--muted-foreground)] transition-transform',
                    !isExpanded && '-rotate-90'
                  )}
                />
              </button>
            )}
            <h2 className="text-serif text-xl font-bold text-[var(--foreground)]">
              {title}
            </h2>
          </div>
          {description && (
            <p className="mt-1 text-sm text-[var(--muted-foreground)] max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {headerAction && (
          <div className="flex-shrink-0">
            {headerAction}
          </div>
        )}
      </header>

      {/* Section Content */}
      {(!collapsible || isExpanded) && (
        <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </section>
  )
}

// Subsection for nested content
interface SubsectionProps {
  children: React.ReactNode
  title?: string
  className?: string
}

export function Subsection({ children, title, className }: SubsectionProps) {
  return (
    <div className={cn('mt-6', className)}>
      {title && (
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wide">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
