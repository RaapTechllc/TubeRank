import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createServerClient } from '@/lib/supabase/server'
import { GET } from '@/app/api/analytics/performance/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server')

describe('Performance Analytics', () => {
  const mockSupabase = {
    rpc: vi.fn(),
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)
  })

  describe('GET /api/analytics/performance', () => {
    it('should return performance data with summary', async () => {
      const mockSummaryData = [{
        total_views: 1000,
        total_likes: 50,
        total_comments: 20,
        avg_score: 75.5,
        total_videos: 10,
        views_change: 50,
        score_change: 5
      }]

      const mockDailyData = [{
        date: '2024-01-10',
        views: 100,
        likes: 5,
        comments: 2,
        avg_score: 75,
        video_count: 1
      }]

      mockSupabase.rpc.mockResolvedValueOnce({ data: mockSummaryData, error: null })
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockDailyData, error: null })

      const request = new NextRequest('http://localhost:3000/api/analytics/performance?dateRange=30d')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.totalViews).toBe(1000)
      expect(data.summary.viewsChange).toBe(50)
      expect(data.data).toHaveLength(1)
    })

    it('should handle errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } })

      const request = new NextRequest('http://localhost:3000/api/analytics/performance?dateRange=7d')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    it('should default to 30d when invalid range provided', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null })
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null })

      const request = new NextRequest('http://localhost:3000/api/analytics/performance?dateRange=invalid')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2)
    })
  })
})
