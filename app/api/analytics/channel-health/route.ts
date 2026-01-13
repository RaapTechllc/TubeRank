import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { requireAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/rate-limit/middleware'
import { RATE_LIMITS } from '@/lib/rate-limit/config'
type SortBy = 'trust' | 'uploads' | 'avgScore' | 'subscribers' | 'name'
type SortOrder = 'asc' | 'desc'

interface ChannelHealthData {
  id: string
  name: string
  thumbnailUrl?: string
  subscriberCount: number
  videoCount: number
  trustScore: number
  avgScore: number
  totalViews: number
  lastCheckedAt?: string
  recentUploads: number // Videos in last 30 days
  uploadTrend: Array<{ date: string; count: number }> // For sparkline
}

interface TrustScoreDistribution {
  range: string
  count: number
  percentage: number
}

interface ChannelHealthResponse {
  channels: ChannelHealthData[]
  summary: {
    totalChannels: number
    avgTrustScore: number
    avgUploadFrequency: number
    topPerformers: Array<{ name: string; avgScore: number }>
    bottomPerformers: Array<{ name: string; avgScore: number }>
  }
  trustDistribution: TrustScoreDistribution[]
}

async function handleGET(request: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const profileId = searchParams.get('profileId')
  const sortBy = (searchParams.get('sortBy') || 'trust') as SortBy
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as SortOrder
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  const supabase = createServerClient()

  try {
    // Fetch channels
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .order('trust_score', { ascending: false })
      .limit(limit)

    if (channelsError) {
      console.error('Analytics channel-health channels query error:', channelsError)
      return NextResponse.json({ error: channelsError.message }, { status: 500 })
    }

    if (!channels || channels.length === 0) {
      const emptyResponse: ChannelHealthResponse = {
        channels: [],
        summary: {
          totalChannels: 0,
          avgTrustScore: 0,
          avgUploadFrequency: 0,
          topPerformers: [],
          bottomPerformers: []
        },
        trustDistribution: []
      }
      return NextResponse.json(emptyResponse)
    }

    // Get channel IDs
    const channelIds = channels.map(c => c.id)

    // Fetch videos for these channels with their scores
    let videosQuery = supabase
      .from('videos')
      .select(`
        id,
        channel_id,
        view_count,
        published_at,
        scores(overall_score, profile_id)
      `)
      .in('channel_id', channelIds)

    const { data: videos, error: videosError } = await videosQuery

    if (videosError) {
      console.error('Analytics channel-health videos query error:', videosError)
    }

    // Calculate upload trend (last 30 days, grouped by week)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Process channel data
    const channelHealthData: ChannelHealthData[] = channels.map(channel => {
      const channelVideos = videos?.filter(v => v.channel_id === channel.id) || []

      // Calculate average score for this channel
      const allScores: number[] = []
      for (const video of channelVideos) {
        const videoScores = video.scores as Array<{ overall_score: number; profile_id: string }> | null
        if (videoScores) {
          // If profileId filter is set, only use scores for that profile
          const relevantScores = profileId
            ? videoScores.filter(s => s.profile_id === profileId)
            : videoScores
          allScores.push(...relevantScores.map(s => s.overall_score))
        }
      }
      const avgScore = allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0

      // Calculate total views
      const totalViews = channelVideos.reduce((sum, v) => sum + (v.view_count || 0), 0)

      // Count recent uploads (last 30 days)
      const recentUploads = channelVideos.filter(v => {
        if (!v.published_at) return false
        return new Date(v.published_at) >= thirtyDaysAgo
      }).length

      // Calculate upload trend (simplified: count per week for last 4 weeks)
      const uploadTrend: Array<{ date: string; count: number }> = []
      for (let week = 3; week >= 0; week--) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - (week + 1) * 7)
        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() - week * 7)

        const count = channelVideos.filter(v => {
          if (!v.published_at) return false
          const pubDate = new Date(v.published_at)
          return pubDate >= weekStart && pubDate < weekEnd
        }).length

        uploadTrend.push({
          date: weekStart.toISOString().split('T')[0] ?? '',
          count
        })
      }

      return {
        id: channel.id,
        name: channel.name,
        thumbnailUrl: channel.thumbnail_url,
        subscriberCount: channel.subscriber_count || 0,
        videoCount: channel.video_count || 0,
        trustScore: channel.trust_score,
        avgScore,
        totalViews,
        lastCheckedAt: channel.last_checked_at,
        recentUploads,
        uploadTrend
      }
    })

    // Sort channels
    const sortedChannels = [...channelHealthData].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'trust':
          comparison = a.trustScore - b.trustScore
          break
        case 'uploads':
          comparison = a.recentUploads - b.recentUploads
          break
        case 'avgScore':
          comparison = a.avgScore - b.avgScore
          break
        case 'subscribers':
          comparison = a.subscriberCount - b.subscriberCount
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Calculate summary statistics
    const totalChannels = channels.length
    const avgTrustScore = Math.round(
      channels.reduce((sum, c) => sum + c.trust_score, 0) / totalChannels
    )
    const avgUploadFrequency = Math.round(
      channelHealthData.reduce((sum, c) => sum + c.recentUploads, 0) / totalChannels * 10
    ) / 10

    // Top and bottom performers by average score
    const scoredChannels = channelHealthData
      .filter(c => c.avgScore > 0)
      .sort((a, b) => b.avgScore - a.avgScore)

    const topPerformers = scoredChannels.slice(0, 5).map(c => ({
      name: c.name,
      avgScore: c.avgScore
    }))

    const bottomPerformers = scoredChannels.slice(-5).reverse().map(c => ({
      name: c.name,
      avgScore: c.avgScore
    }))

    // Trust score distribution (buckets of 10)
    const trustBuckets: TrustScoreDistribution[] = []
    for (let i = 0; i < 10; i++) {
      const min = i * 10
      const max = (i + 1) * 10
      const count = channels.filter(c => c.trust_score >= min && c.trust_score < max).length
      trustBuckets.push({
        range: `${min}-${max}`,
        count,
        percentage: Math.round((count / totalChannels) * 1000) / 10
      })
    }
    // Handle 100 score
    const count100 = channels.filter(c => c.trust_score === 100).length
    const lastBucket = trustBuckets[9]
    if (count100 > 0 && lastBucket) {
      lastBucket.count += count100
      lastBucket.percentage = Math.round(
        (lastBucket.count / totalChannels) * 1000
      ) / 10
    }

    const response: ChannelHealthResponse = {
      channels: sortedChannels,
      summary: {
        totalChannels,
        avgTrustScore,
        avgUploadFrequency,
        topPerformers,
        bottomPerformers
      },
      trustDistribution: trustBuckets
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analytics channel-health error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channel health data' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(handleGET, RATE_LIMITS.API)
