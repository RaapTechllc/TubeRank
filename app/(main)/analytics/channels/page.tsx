'use client'

import { AnalyticsLayout } from '@/components/analytics/AnalyticsLayout'
import { AnalyticsGrid } from '@/components/analytics/AnalyticsGrid'
import { AnalyticsSection } from '@/components/analytics/AnalyticsSection'
import { StatCard, StatCardSkeleton } from '@/components/analytics/StatCard'
import { FilterBar } from '@/components/analytics/FilterBar'
import { TrendSparkline, LineSparkline } from '@/components/analytics/charts/TrendSparkline'
import { useChannelHealth } from '@/lib/hooks/use-analytics'
import { useAnalyticsStore } from '@/lib/stores/analytics-store'
import { Users, Shield, Upload, TrendingUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ChannelsAnalyticsPage() {
  const { filters, setChannelSortBy, setChannelSortOrder } = useAnalyticsStore()
  const { data, isLoading, isError } = useChannelHealth(
    filters.profileId || undefined,
    filters.channelSortBy,
    filters.channelSortOrder
  )

  const handleSort = (sortBy: typeof filters.channelSortBy) => {
    if (filters.channelSortBy === sortBy) {
      setChannelSortOrder(filters.channelSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setChannelSortBy(sortBy)
      setChannelSortOrder('desc')
    }
  }

  if (isError) {
    return (
      <AnalyticsLayout title="Channel Health">
        <div className="editorial-card p-8 text-center">
          <p className="text-[var(--chart-5)]">Failed to load channel data.</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Please try again later.
          </p>
        </div>
      </AnalyticsLayout>
    )
  }

  return (
    <AnalyticsLayout
      title="Channel Health"
      description="Monitor the performance and reliability of your content sources."
    >
      {/* Filter Bar */}
      <FilterBar className="mb-8" showDateRange={false} />

      {/* Summary Stats */}
      <AnalyticsSection title="Overview">
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
                label="Total Channels"
                value={data?.summary.totalChannels || 0}
                icon={<Users className="h-5 w-5" />}
              />
              <StatCard
                label="Avg Trust Score"
                value={data?.summary.avgTrustScore || 0}
                icon={<Shield className="h-5 w-5" />}
              />
              <StatCard
                label="Avg Uploads/Month"
                value={data?.summary.avgUploadFrequency || 0}
                icon={<Upload className="h-5 w-5" />}
              />
              <StatCard
                label="Top Performers"
                value={data?.summary.topPerformers?.length || 0}
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </>
          )}
        </AnalyticsGrid>
      </AnalyticsSection>

      {/* Trust Score Distribution */}
      {data?.trustDistribution && data.trustDistribution.length > 0 && (
        <AnalyticsSection title="Trust Score Distribution">
          <div className="editorial-card p-6">
            <div className="flex items-end gap-2 h-32">
              {data.trustDistribution.map((bucket, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${Math.max(bucket.percentage * 2, 4)}%`,
                      backgroundColor: index >= 7 ? 'var(--chart-2)' :
                        index >= 5 ? 'var(--chart-3)' :
                        index >= 3 ? 'var(--chart-1)' : 'var(--chart-5)',
                    }}
                    title={`${bucket.range}: ${bucket.count} channels (${bucket.percentage}%)`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-[var(--muted-foreground)]">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
            <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
              Trust Score Range
            </p>
          </div>
        </AnalyticsSection>
      )}

      {/* Channels Table */}
      <AnalyticsSection title="All Channels">
        <div className="editorial-card overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="editorial-table">
              <thead className="sticky top-0 bg-[var(--muted)]">
                <tr>
                  <th>Channel</th>
                  <th
                    className="text-right cursor-pointer hover:text-[var(--primary)] transition-colors"
                    onClick={() => handleSort('trust')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Trust
                      {filters.channelSortBy === 'trust' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </th>
                  <th
                    className="text-right cursor-pointer hover:text-[var(--primary)] transition-colors"
                    onClick={() => handleSort('avgScore')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Avg Score
                      {filters.channelSortBy === 'avgScore' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </th>
                  <th
                    className="text-right cursor-pointer hover:text-[var(--primary)] transition-colors"
                    onClick={() => handleSort('subscribers')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Subscribers
                      {filters.channelSortBy === 'subscribers' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </th>
                  <th
                    className="text-right cursor-pointer hover:text-[var(--primary)] transition-colors"
                    onClick={() => handleSort('uploads')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Recent
                      {filters.channelSortBy === 'uploads' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </th>
                  <th className="text-center w-24">Trend</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton-editorial h-4 w-32" /></td>
                      <td><div className="skeleton-editorial h-4 w-12 ml-auto" /></td>
                      <td><div className="skeleton-editorial h-4 w-12 ml-auto" /></td>
                      <td><div className="skeleton-editorial h-4 w-16 ml-auto" /></td>
                      <td><div className="skeleton-editorial h-4 w-8 ml-auto" /></td>
                      <td><div className="skeleton-editorial h-4 w-16 mx-auto" /></td>
                    </tr>
                  ))
                ) : data?.channels && data.channels.length > 0 ? (
                  data.channels.map((channel) => (
                    <tr key={channel.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {channel.thumbnailUrl ? (
                            <img
                              src={channel.thumbnailUrl}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center">
                              <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                            </div>
                          )}
                          <span className="font-medium">{channel.name}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <span
                          className={cn(
                            'text-data font-medium',
                            channel.trustScore >= 70 && 'text-[var(--chart-2)]',
                            channel.trustScore >= 40 && channel.trustScore < 70 && 'text-[var(--chart-3)]',
                            channel.trustScore < 40 && 'text-[var(--chart-5)]'
                          )}
                        >
                          {channel.trustScore}
                        </span>
                      </td>
                      <td className="text-right text-data">{channel.avgScore || '-'}</td>
                      <td className="text-right text-data">
                        {channel.subscriberCount > 0
                          ? channel.subscriberCount.toLocaleString()
                          : '-'}
                      </td>
                      <td className="text-right text-data">{channel.recentUploads}</td>
                      <td className="text-center">
                        {channel.uploadTrend && channel.uploadTrend.length > 0 ? (
                          <LineSparkline
                            data={channel.uploadTrend.map(t => t.count)}
                            color="var(--chart-1)"
                            height={24}
                            width={60}
                          />
                        ) : (
                          <span className="text-[var(--muted-foreground)]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[var(--muted-foreground)]">
                      No channels found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AnalyticsSection>

      {/* Top & Bottom Performers */}
      {data?.summary.topPerformers && data.summary.topPerformers.length > 0 && (
        <AnalyticsGrid columns={2} className="mt-8">
          <AnalyticsSection title="Top Performers">
            <div className="editorial-card overflow-hidden">
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th className="text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.summary.topPerformers.map((channel, index) => (
                    <tr key={index}>
                      <td className="font-medium">{channel.name}</td>
                      <td className="text-right text-data text-[var(--chart-2)]">
                        {channel.avgScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnalyticsSection>

          <AnalyticsSection title="Needs Improvement">
            <div className="editorial-card overflow-hidden">
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th className="text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.summary.bottomPerformers.map((channel, index) => (
                    <tr key={index}>
                      <td className="font-medium">{channel.name}</td>
                      <td className="text-right text-data text-[var(--chart-5)]">
                        {channel.avgScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnalyticsSection>
        </AnalyticsGrid>
      )}
    </AnalyticsLayout>
  )
}
