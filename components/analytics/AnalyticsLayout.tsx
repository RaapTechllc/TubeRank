'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, BarChart3, TrendingUp, Target, Radio, GitBranch, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalyticsLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

const NAV_ITEMS = [
  { href: '/analytics', label: 'Overview', icon: LayoutDashboard },
  { href: '/analytics/performance', label: 'Performance', icon: TrendingUp },
  { href: '/analytics/scores', label: 'Scores', icon: Target },
  { href: '/analytics/channels', label: 'Channels', icon: Radio },
  { href: '/analytics/velocity', label: 'Velocity', icon: BarChart3 },
  { href: '/analytics/workflow', label: 'Workflow', icon: GitBranch },
]

function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <nav className="breadcrumb flex items-center" aria-label="Breadcrumb">
      <Link href="/dashboard" className="hover:text-primary transition-colors">
        Dashboard
      </Link>
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1
        const label = segment.charAt(0).toUpperCase() + segment.slice(1)

        return (
          <span key={href} className="flex items-center">
            <ChevronRight className="breadcrumb-separator h-4 w-4" />
            {isLast ? (
              <span className="text-muted-foreground">{label}</span>
            ) : (
              <Link href={href} className="hover:text-primary transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

function NavTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 border-b border-[var(--border)] -mx-8 px-8 mb-8">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/analytics' && pathname.startsWith(href))

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
              'hover:text-[var(--primary)]',
              isActive
                ? 'text-[var(--primary)]'
                : 'text-[var(--muted-foreground)]'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function AnalyticsLayout({ children, title, description }: AnalyticsLayoutProps) {
  return (
    <div className="editorial-theme min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb />

        {/* Header */}
        {(title || description) && (
          <header className="mt-6 mb-8">
            {title && (
              <h1 className="text-display text-3xl text-[var(--foreground)]">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2 text-[var(--muted-foreground)] text-base max-w-2xl">
                {description}
              </p>
            )}
          </header>
        )}

        {/* Navigation Tabs */}
        <NavTabs />

        {/* Main Content */}
        <main>
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[var(--border)] text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            TubeRank Analytics
          </p>
        </footer>
      </div>
    </div>
  )
}
