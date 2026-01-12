'use client'

import { useQuery } from '@tanstack/react-query'

// ============================================================================
// Types
// ============================================================================

export type DateRange = '7d' | '30d' | '90d' | '1y'
export type ScoreDimension = 'overall' | 'relevance' | 'novelty' | 'actionability' | 'credibility' | 'efficiency'
export type GroupBy = 'day' | 'week' | 'month'
export type SortBy = 'trust' | 'uploads' | 'avgScore' | 'subscribers' | 'name'
export type SortOrder = 'asc' | 'desc'

// Performance types
export interface PerformanceDataPoint {
  date: string
  views: number
  likes: number
  comments: number
  avgScore: number
  videoCount: number
}

export interface PerformanceResponse {
  data: PerformanceDataPoint[]
  summary: {
    totalViews: number
    totalLikes: number
    totalComments: number
    avgScore: number
    totalVideos: number
    viewsChange: number
    scoreChange: number
  }
}

// Score distribution types
export interface HistogramBucket {
  range: string
  min: number
  max: number
  count: number
  percentage: number
}

export interface ScoreStats {
  mean: number
  median: number
  min: number
  max: number
  stdDev: number
  q1: number
  q3: number
  count: number
}

export interface RadarData {
  dimension: string
  value: number
  fullMark: number
}

export interface ScoreDistributionResponse {
  histogram: HistogramBucket[]
  stats: ScoreStats
  radar: RadarData[]
  rawScores: number[]
}

// Channel health types
export interface ChannelHealthData {
  id: string
  name: string
  thumbnailUrl?: string
  subscriberCount: number
  videoCount: number
  trustScore: number
  avgScore: number
  totalViews: number
  lastCheckedAt?: string
  recentUploads: number
  uploadTrend: Array<{ date: string; count: number }>
}

export interface TrustScoreDistribution {
  range: string
  count: number
  percentage: number
}

export interface ChannelHealthResponse {
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

// Velocity types
export interface VelocityDataPoint {
  date: string
  count: number
  cumulative: number
}

export interface SourceBreakdown {
  source: string
  count: number
  percentage: number
}

export interface ProcessingMetrics {
  avgProcessingTime: number
  p95ProcessingTime: number
  pendingCount: number
  failedCount: number
  completedCount: number
}

export interface VelocityResponse {
  data: VelocityDataPoint[]
  sourceBreakdown: SourceBreakdown[]
  processing: ProcessingMetrics
  summary: {
    totalIngested: number
    avgPerDay: number
    trend: number
  }
}

// Workflow funnel types
export type ColumnStatus = 'inbox' | 'recommended' | 'skim' | 'watch' | 'archived'

export interface FunnelStage {
  stage: ColumnStatus
  label: string
  count: number
  percentage: number
  avgTimeInStage: number
}

export interface FlowData {
  source: string
  target: string
  value: number
}

export interface ConversionRate {
  from: string
  to: string
  rate: number
  count: number
}

export interface WorkflowFunnelResponse {
  funnel: FunnelStage[]
  flow: FlowData[]
  conversions: ConversionRate[]
  summary: {
    totalCards: number
    completionRate: number
    avgTimeToComplete: number
    mostActiveStage: string
  }
}

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchPerformance(
  profileId?: string,
  dateRange: DateRange = '30d'
): Promise<PerformanceResponse> {
  const params = new URLSearchParams()
  if (profileId) params.set('profileId', profileId)
  params.set('dateRange', dateRange)

  const response = await fetch(`/api/analytics/performance?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch performance data')
  }
  return response.json()
}

async function fetchScoreDistribution(
  profileId?: string,
  dimension: ScoreDimension = 'overall'
): Promise<ScoreDistributionResponse> {
  const params = new URLSearchParams()
  if (profileId) params.set('profileId', profileId)
  params.set('dimension', dimension)

  const response = await fetch(`/api/analytics/score-distribution?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch score distribution')
  }
  return response.json()
}

async function fetchChannelHealth(
  profileId?: string,
  sortBy: SortBy = 'trust',
  sortOrder: SortOrder = 'desc'
): Promise<ChannelHealthResponse> {
  const params = new URLSearchParams()
  if (profileId) params.set('profileId', profileId)
  params.set('sortBy', sortBy)
  params.set('sortOrder', sortOrder)

  const response = await fetch(`/api/analytics/channel-health?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch channel health data')
  }
  return response.json()
}

async function fetchVelocity(
  profileId?: string,
  groupBy: GroupBy = 'day',
  days: number = 30
): Promise<VelocityResponse> {
  const params = new URLSearchParams()
  if (profileId) params.set('profileId', profileId)
  params.set('groupBy', groupBy)
  params.set('days', days.toString())

  const response = await fetch(`/api/analytics/velocity?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch velocity data')
  }
  return response.json()
}

async function fetchWorkflowFunnel(
  profileId?: string,
  days: number = 30
): Promise<WorkflowFunnelResponse> {
  const params = new URLSearchParams()
  if (profileId) params.set('profileId', profileId)
  params.set('days', days.toString())

  const response = await fetch(`/api/analytics/workflow-funnel?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch workflow funnel data')
  }
  return response.json()
}

// ============================================================================
// React Query Hooks
// ============================================================================

const STALE_TIME = 5 * 60 * 1000 // 5 minutes

export function usePerformanceData(
  profileId?: string,
  dateRange: DateRange = '30d'
) {
  return useQuery({
    queryKey: ['analytics', 'performance', profileId, dateRange],
    queryFn: () => fetchPerformance(profileId, dateRange),
    staleTime: STALE_TIME,
  })
}

export function useScoreDistribution(
  profileId?: string,
  dimension: ScoreDimension = 'overall'
) {
  return useQuery({
    queryKey: ['analytics', 'score-distribution', profileId, dimension],
    queryFn: () => fetchScoreDistribution(profileId, dimension),
    staleTime: STALE_TIME,
  })
}

export function useChannelHealth(
  profileId?: string,
  sortBy: SortBy = 'trust',
  sortOrder: SortOrder = 'desc'
) {
  return useQuery({
    queryKey: ['analytics', 'channel-health', profileId, sortBy, sortOrder],
    queryFn: () => fetchChannelHealth(profileId, sortBy, sortOrder),
    staleTime: STALE_TIME,
  })
}

export function useVelocityData(
  profileId?: string,
  groupBy: GroupBy = 'day',
  days: number = 30
) {
  return useQuery({
    queryKey: ['analytics', 'velocity', profileId, groupBy, days],
    queryFn: () => fetchVelocity(profileId, groupBy, days),
    staleTime: STALE_TIME,
  })
}

export function useWorkflowFunnel(
  profileId?: string,
  days: number = 30
) {
  return useQuery({
    queryKey: ['analytics', 'workflow-funnel', profileId, days],
    queryFn: () => fetchWorkflowFunnel(profileId, days),
    staleTime: STALE_TIME,
  })
}

// ============================================================================
// Combined Dashboard Hook
// ============================================================================

export function useAnalyticsDashboard(profileId?: string, dateRange: DateRange = '30d') {
  const performance = usePerformanceData(profileId, dateRange)
  const scores = useScoreDistribution(profileId)
  const channels = useChannelHealth(profileId)
  const velocity = useVelocityData(profileId, 'day', dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : dateRange === '1y' ? 365 : 30)
  const workflow = useWorkflowFunnel(profileId)

  return {
    performance,
    scores,
    channels,
    velocity,
    workflow,
    isLoading: performance.isLoading || scores.isLoading || channels.isLoading || velocity.isLoading || workflow.isLoading,
    isError: performance.isError || scores.isError || channels.isError || velocity.isError || workflow.isError,
  }
}
