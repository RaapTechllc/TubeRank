'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProfileList } from '@/components/profiles/profile-list'
import { Plus, Terminal, Activity, RefreshCw } from 'lucide-react'
import { useProfiles } from '@/lib/hooks/use-profiles'
import { useState } from 'react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { data: profiles } = useProfiles()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const stats = {
    active: profiles?.filter(p => p.is_active).length ?? 0,
    total: profiles?.length ?? 0,
    sources: profiles?.reduce((acc, p) => acc + (p.profile_sources?.length ?? 0), 0) ?? 0,
    videos: 0, // Will be populated when video data is available
  }

  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/rss/refresh', {
        method: 'POST'
      })
      const data = await response.json()

      if (response.ok) {
        if (data.enqueued > 0) {
          toast.success(`Checking ${data.enqueued} channel${data.enqueued > 1 ? 's' : ''} for new videos`)
        } else if (data.skipped > 0) {
          toast.info('Channels already being refreshed')
        } else {
          toast.info('No channels to refresh')
        }
      } else if (response.status === 429) {
        toast.error('Too many requests. Please wait a few minutes.')
      } else {
        toast.error(data.error || 'Refresh failed')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="relative crt-screen">
      {/* VHS scan line effect */}
      <div className="scan-line" />

      {/* Header with brutal aesthetics */}
      <div className="mb-12 relative">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-primary text-primary-foreground p-3 border-brutal relative overflow-hidden group/icon">
                <Terminal className="h-8 w-8 relative z-10" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-primary/50 blur-xl opacity-0 group-hover/icon:opacity-100 transition-opacity" />
              </div>
              <div>
                <h1
                  className="text-6xl font-bold tracking-tight text-primary font-mono uppercase chromatic relative"
                  data-text="TUBERANK"
                >
                  TUBERANK
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent animate-pulse-glow border border-accent" />
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-[3px] w-12 bg-accent animate-pulse" />
                  <p className="text-sm tracking-[0.2em] text-muted-foreground uppercase font-mono">
                    Content Intelligence Dashboard
                  </p>
                  <div className="flex items-center gap-1 ml-2">
                    <Activity className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-xs text-primary font-mono">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="border-brutal bg-accent text-accent-foreground hover:bg-accent/90 font-bold tracking-wide uppercase text-sm px-6 py-6 transition-all hover:translate-x-[-3px] hover:translate-y-[-3px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={3} />
              {isRefreshing ? 'Refreshing...' : 'Refresh All'}
            </Button>
            <Link href="/profile/new">
              <Button
                className="border-brutal bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide uppercase text-base px-8 py-6 transition-all hover:translate-x-[-3px] hover:translate-y-[-3px]"
              >
                <Plus className="h-5 w-5 mr-2" strokeWidth={3} />
                New Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative grid lines */}
        <div className="absolute -bottom-6 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="border-2 border-primary/30 p-4 relative overflow-hidden group hover:border-primary transition-all perspective-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 transform rotate-45 translate-x-8 -translate-y-8" />
          <div className="data-stream" style={{ animationDelay: '0s' }} />
          <div className="text-xs font-mono text-primary/70 tracking-wider uppercase mb-1 flex items-center gap-2">
            Active
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          </div>
          <div className="text-3xl font-bold font-mono text-primary tabular-nums">
            {String(stats.active).padStart(2, '0')}
          </div>
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-primary/30">PRF</div>
        </div>
        <div className="border-2 border-accent/30 p-4 relative overflow-hidden group hover:border-accent transition-all perspective-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 transform rotate-45 translate-x-8 -translate-y-8" />
          <div className="data-stream" style={{ animationDelay: '0.5s' }} />
          <div className="text-xs font-mono text-accent/70 tracking-wider uppercase mb-1">Total</div>
          <div className="text-3xl font-bold font-mono text-accent tabular-nums">
            {String(stats.total).padStart(2, '0')}
          </div>
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-accent/30">CNT</div>
        </div>
        <div className="border-2 border-chart-2/30 p-4 relative overflow-hidden group hover:border-chart-2 transition-all perspective-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-chart-2/5 transform rotate-45 translate-x-8 -translate-y-8" />
          <div className="data-stream" style={{ animationDelay: '1s' }} />
          <div className="text-xs font-mono text-chart-2/70 tracking-wider uppercase mb-1">Sources</div>
          <div className="text-3xl font-bold font-mono text-chart-2 tabular-nums">
            {String(stats.sources).padStart(2, '0')}
          </div>
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-chart-2/30">SRC</div>
        </div>
        <div className="border-2 border-destructive/30 p-4 relative overflow-hidden group hover:border-destructive transition-all perspective-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/5 transform rotate-45 translate-x-8 -translate-y-8" />
          <div className="data-stream" style={{ animationDelay: '1.5s' }} />
          <div className="text-xs font-mono text-destructive/70 tracking-wider uppercase mb-1">Videos</div>
          <div className="text-3xl font-bold font-mono text-destructive tabular-nums">
            {String(stats.videos).padStart(2, '0')}
          </div>
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-destructive/30">VID</div>
        </div>
      </div>

      {/* Main content */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-[3px] w-8 bg-primary" />
          <h2 className="text-2xl font-bold tracking-tight uppercase font-mono">Your Profiles</h2>
        </div>
        <ProfileList />
      </div>
    </div>
  )
}
