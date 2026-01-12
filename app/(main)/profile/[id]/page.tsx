'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/board/kanban-board'
import { useProfile, useProfileChannels } from '@/lib/hooks/use-profiles'
import { Settings, ArrowLeft, RefreshCw, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: profile, isLoading } = useProfile(id)
  const { data: channelsData } = useProfileChannels(id)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/rss/refresh/${id}`, {
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
        toast.error('Too many requests. Please wait a minute.')
      } else {
        toast.error(data.error || 'Refresh failed')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="h-96 bg-muted/50 rounded animate-pulse" />
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
        <Link href="/dashboard">
          <Button variant="link">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            {channelsData?.lastCheckedAt && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>
                  Last checked {formatDistanceToNow(new Date(channelsData.lastCheckedAt), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="icon"
            title="Refresh videos"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Link href={`/profile/${id}/edit`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>
      <KanbanBoard profileId={id} />
    </div>
  )
}
