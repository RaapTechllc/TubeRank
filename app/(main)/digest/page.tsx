'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Star, RefreshCw } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'

interface DigestAlert {
  id: string
  profile_id: string
  title: string
  message: string
  created_at: string
  is_read: boolean
  profiles: {
    id: string
    name: string
  }
}

interface DigestResponse {
  alerts: DigestAlert[]
}

export default function DigestPage() {
  const [alerts, setAlerts] = useState<DigestAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDigests = async () => {
    try {
      const response = await fetch('/api/digest')
      if (!response.ok) {
        throw new Error('Failed to fetch digest data')
      }
      const data: DigestResponse = await response.json()
      setAlerts(data.alerts)
    } catch (error) {
      console.error('Failed to fetch digests:', error)
      toast.error('Failed to load digest data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDigests()
  }

  useEffect(() => {
    fetchDigests()
  }, [])

  const parseVideoList = (message: string) => {
    const lines = message.split('\n')
    const videoLines = lines.filter(line => /^\d+\./.test(line.trim()))
    return videoLines.map(line => {
      const match = line.match(/^(\d+)\.\s*(.+?)\s*\(Score:\s*(\d+)\)$/)
      if (match && match[1] && match[2] && match[3]) {
        return {
          rank: parseInt(match[1]),
          title: match[2].trim(),
          score: parseInt(match[3])
        }
      }
      return null
    }).filter((item): item is NonNullable<typeof item> => item !== null)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className="h-64 bg-muted rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Digest</h1>
          <p className="text-muted-foreground">
            High-scoring videos from your profiles over the last 7 days
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Digest Cards */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No digest data available</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Daily digests will appear here when high-scoring videos are found in your profiles.
              Make sure you have active profiles with recent video activity.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {alerts.map((alert) => {
            const videos = parseVideoList(alert.message)
            const date = new Date(alert.created_at)
            
            return (
              <Card key={alert.id} className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.01] group">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors duration-200">
                        {alert.profiles.name}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(date, 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={alert.is_read ? 'secondary' : 'default'} className="transition-all duration-200 group-hover:scale-105">
                      {videos.length} videos
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {videos.length > 0 ? (
                    <div className="space-y-3">
                      {videos.map((video, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200 hover:scale-[1.01] group/video"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary transition-all duration-200 group-hover/video:bg-primary/20 group-hover/video:scale-110">
                            {video.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover/video:text-primary transition-colors duration-200">
                              {video.title}
                            </h4>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 transition-transform duration-200 group-hover/video:scale-110" />
                            <span className="text-sm font-medium">{video.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No video details available for this digest.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}