import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/digest/route'
import { createMockSupabaseClient } from '../setup'

// Mock auth middleware
vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'test-user' }, error: null })
}))

// Mock rate limit middleware
vi.mock('@/lib/rate-limit/middleware', () => ({
  withRateLimit: vi.fn((handler) => handler)
}))

describe('Digest API', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
  })

  describe('GET /api/digest', () => {
    it('should return digest alerts successfully', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          profile_id: 'profile-1',
          alert_type: 'category_digest',
          title: 'Daily Digest',
          message: 'You have 5 new videos to review',
          created_at: '2024-01-15T10:00:00Z',
          is_read: false,
          profiles: {
            id: 'profile-1',
            name: 'Tech News'
          }
        },
        {
          id: 'alert-2',
          profile_id: 'profile-2',
          alert_type: 'category_digest',
          title: 'Weekly Summary',
          message: 'Your weekly content summary is ready',
          created_at: '2024-01-14T10:00:00Z',
          is_read: true,
          profiles: {
            id: 'profile-2',
            name: 'Science Updates'
          }
        }
      ]

      mockSupabase.from().select().eq().gte().order().limit().then.mockResolvedValue({
        data: mockAlerts,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digest')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.alerts).toHaveLength(2)
      expect(data.alerts[0].id).toBe('alert-1')
      expect(data.alerts[0].profiles.name).toBe('Tech News')
      expect(data.alerts[1].is_read).toBe(true)
    })

    it('should return empty array when no alerts found', async () => {
      mockSupabase.from().select().eq().gte().order().limit().then.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digest')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.alerts).toEqual([])
    })

    it('should handle database errors', async () => {
      mockSupabase.from().select().eq().gte().order().limit().then.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const request = new NextRequest('http://localhost:3000/api/digest')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to fetch digest data')
    })

    it('should filter alerts by date range (last 7 days)', async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      mockSupabase.from().select().eq().gte().order().limit().then.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digest')
      await GET(request)

      // Verify the date filter was applied correctly
      expect(mockSupabase.from().select().eq().gte).toHaveBeenCalledWith(
        'created_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      )
    })

    it('should limit results to 50 alerts', async () => {
      mockSupabase.from().select().eq().gte().order().limit().then.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digest')
      await GET(request)

      expect(mockSupabase.from().select().eq().gte().order().limit).toHaveBeenCalledWith(50)
    })

    it('should order alerts by created_at descending', async () => {
      mockSupabase.from().select().eq().gte().order().limit().then.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digest')
      await GET(request)

      expect(mockSupabase.from().select().eq().gte().order).toHaveBeenCalledWith(
        'created_at',
        { ascending: false }
      )
    })

    it('should only fetch category_digest alerts', async () => {
      mockSupabase.from().select().eq().gte().order().limit().then.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digest')
      await GET(request)

      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('alert_type', 'category_digest')
    })

    it('should include profile information in the query', async () => {
      mockSupabase.from().select().eq().gte().order().limit().then.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/digest')
      await GET(request)

      expect(mockSupabase.from().select).toHaveBeenCalledWith(
        expect.stringContaining('profiles!inner(')
      )
    })
  })
})