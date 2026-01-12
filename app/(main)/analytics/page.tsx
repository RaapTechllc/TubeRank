'use client'

import Link from 'next/link'
import { AnalyticsLayout } from '@/components/analytics/AnalyticsLayout'
import { AnalyticsGrid, GridItem } from '@/components/analytics/AnalyticsGrid'
import { AnalyticsSection } from '@/components/analytics/AnalyticsSection'
import { StatCard, StatCardSkeleton } from '@/components/analytics/StatCard'
import { FilterBar } from '@/components/analytics/FilterBar'
import { TrendSparkline } from '@/components/analytics/charts/TrendSparkline'
import { useAnalyticsDashboard } from '@/lib/hooks/use-analytics'
import { useAnalyticsStore } from '@/lib/stores/analytics-store'
import { Video, Users, TrendingUp, Clock, ArrowRight, BarChart3, Target, Radio, GitBranch } from 'lucide-react'

const QUICK_LINKS = [
  {
    href: '/analytics/performance',
    title: 'Performance',
    description: 'Track views, engagement, and score trends over time',
    icon: TrendingUp,
    color: 'var(--chart-1)',
  },
  {
    href: '/analytics/scores',
    title: 'Score Analysis',
    description: 'Distribution and breakdown of video scores',
    icon: Target,
    color: 'var(--chart-4)',
  },
  {
    href: '/analytics/channels',
    title: 'Channel Health',
    description: 'Monitor channel performance and trust scores',
    icon: Radio,
    color: 'var(--chart-2)',
  },
  {
    href: '/analytics/workflow',
    title: 'Workflow Funnel',
    description: 'Analyze content progression through stages',
    icon: GitBranch,
    color: 'var(--chart-3)',
  },
]

function QuickLinkCard({
  href,
  title,
  description,
  icon: Icon,
  color,
}: (typeof QUICK_LINKS)[0]) {
  return (
    <Link
      href={href}
      className="editorial-card p-5 group hover:border-[var(--foreground)] transition-colors"
    >
      <div className="flex items-start gap-4">
        <div
          className="p-2 rounded"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
            {title}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {description}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  )
}

export default function AnalyticsOverviewPage() {
  const { filters } = useAnalyticsStore()
  const { performance, scores, channels, velocity, workflow, isLoading } = useAnalyticsDashboard(
    filters.profileId || undefined,
    filters.dateRange
  )

  return (
    <AnalyticsLayout
      title="Analytics Overview"
      description="Monitor your content performance, scores, and workflow at a glance."
    >
      {/* Filter Bar */}
      <FilterBar className="mb-8" />

      {/* Key Metrics */}
      <AnalyticsSection title="Key Metrics">
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
                label="Total Videos"
                value={performance.data?.summary.totalVideos || 0}
                change={performance.data?.summary.viewsChange}
                changeLabel="vs prev period"
                icon={<Video className="h-5 w-5" />}
                sparkline={
                  performance.data?.data && performance.data.data.length > 0 ? (
                    <TrendSparkline
                      data={performance.data.data.map(d => d.videoCount)}
                      trend={
                        (performance.data.summary.viewsChange || 0) > 0 ? 'up' :
                        (performance.data.summary.viewsChange || 0) < 0 ? 'down' : 'neutral'
                      }
                    />
                  ) : undefined
                }
              />
              <StatCard
                label="Average Score"
                value={scores.data?.stats.mean || 0}
                format="number"
                icon={<Target className="h-5 w-5" />}
                change={performance.data?.summary.scoreChange}
                changeLabel="vs prev period"
              />
              <StatCard
                label="Active Channels"
                value={channels.data?.summary.totalChannels || 0}
                icon={<Users className="h-5 w-5" />}
                sparkline={
                  channels.data?.trustDistribution ? (
                    <TrendSparkline
                      data={channels.data.trustDistribution.map(d => d.count)}
                      color="var(--chart-2)"
                    />
                  ) : undefined
                }
              />
              <StatCard
                label="Completion Rate"
                value={workflow.data?.summary.completionRate || 0}
                format="percentage"
                icon={<Clock className="h-5 w-5" />}
              />
            </>
          )}
        </AnalyticsGrid>
      </AnalyticsSection>

      {/* Secondary Metrics */}
      <AnalyticsSection title="Content Velocity">
        <AnalyticsGrid columns={3}>
          {isLoading ? (
            <>
              <StatCardSkeleton size="sm" />
              <StatCardSkeleton size="sm" />
              <StatCardSkeleton size="sm" />
            </>
          ) : (
            <>
              <StatCard
                label="Avg. Videos/Day"
                value={velocity.data?.summary.avgPerDay || 0}
                change={velocity.data?.summary.trend}
                size="sm"
                icon={<BarChart3 className="h-4 w-4" />}
              />
              <StatCard
                label="Total Ingested"
                value={velocity.data?.summary.totalIngested || 0}
                size="sm"
              />
              <StatCard
                label="Avg. Time to Complete"
                value={workflow.data?.summary.avgTimeToComplete || 0}
                format="duration"
                size="sm"
              />
            </>
          )}
        </AnalyticsGrid>
      </AnalyticsSection>

      {/* Quick Links */}
      <AnalyticsSection
        title="Explore Analytics"
        description="Dive deeper into specific areas of your content performance."
      >
        <AnalyticsGrid columns={2}>
          {QUICK_LINKS.map((link) => (
            <QuickLinkCard key={link.href} {...link} />
          ))}
        </AnalyticsGrid>
      </AnalyticsSection>

      {/* Top Performers */}
      {channels.data?.summary.topPerformers && channels.data.summary.topPerformers.length > 0 && (
        <AnalyticsSection title="Top Performing Channels">
          <div className="editorial-card overflow-hidden">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th className="text-right">Avg. Score</th>
                </tr>
              </thead>
              <tbody>
                {channels.data.summary.topPerformers.map((channel, index) => (
                  <tr key={index}>
                    <td className="font-medium">{channel.name}</td>
                    <td className="text-right text-data">{channel.avgScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnalyticsSection>
      )}
    </AnalyticsLayout>
  )
}
