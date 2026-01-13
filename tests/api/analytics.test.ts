import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getPerformance } from '@/app/api/analytics/performance/route'
import { GET as getChannelHealth } from '@/app/api/analytics/channel-health/route'
import { GET as getVelocity } from '@/app/api/analytics/velocity/route'
import { createMockSupabaseClient } from '../setup'

// Mock auth middleware
vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'test-user' }, error: null })
}))

// Mock rate limit middleware
vi.mock('@/lib/rate-limit/middleware', () => ({
  withRateLimit: vi.fn((handler) => handler)
}))

describe('Analytics API', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
  })

  describe('GET /api/analytics/performance', () => {
    it('should return performance metrics', async () => {
      const mockData = {
        total_cards: 150,
        processed_cards: 120,
        avg_processing_time: 2.5,
        success_rate: 0.95
      }
      
      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const request = new NextRequest('http://localhost:3000/api/analytics/performance')
      const response = await getPerformance(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockData)
    })

    it('should handle database errors', async () => {
      mockSupabase.rpc.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/performance')
      const response = await getPerformance(request)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to fetch performance metrics')
    })
  })

  describe('GET /api/analytics/channel-health', () => {
    it('should return channel health data', async () => {
      const mockData = [
        { channel_id: 'ch1', health_score: 85, video_count: 50 },
        { channel_id: 'ch2', health_score: 92, video_count: 75 }
      ]
      
      mockSupabase.from().select().then.mockResolvedValue({ data: mockData, error: null })

      const request = new NextRequest('http://localhost:3000/api/analytics/channel-health')
      const response = await getChannelHealth(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockData)
    })

    it('should handle empty results', async () => {
      mockSupabase.from().select().then.mockResolvedValue({ data: [], error: null })

      const request = new NextRequest('http://localhost:3000/api/analytics/channel-health')
      const response = await getChannelHealth(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual([])
    })
  })

  describe('GET /api/analytics/velocity', () => {
    it('should return velocity metrics with date range', async () => {
      const mockData = [
        { date: '2024-01-01', cards_processed: 25, avg_time: 1.8 },
        { date: '2024-01-02', cards_processed: 30, avg_time: 2.1 }
      ]
      
      mockSupabase.from().select().gte().lte().order().then.mockResolvedValue({ 
        data: mockData, 
        error: null 
      })

      const url = 'http://localhost:3000/api/analytics/velocity?startDate=2024-01-01&endDate=2024-01-02'
      const request = new NextRequest(url)
      const response = await getVelocity(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockData)
    })

    it('should handle invalid date parameters', async () => {
      const url = 'http://localhost:3000/api/analytics/velocity?startDate=invalid&endDate=2024-01-02'
      const request = new NextRequest(url)
      const response = await getVelocity(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid date parameters')
    })
  })
})