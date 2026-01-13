import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT } from '@/app/api/settings/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/middleware/auth')
vi.mock('@/lib/supabase/server')

describe('Settings API', () => {
  const mockAuth = { error: null, user: { id: 'user-1' } }
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'settings-1' }, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(require('@/lib/middleware/auth').requireAuth).mockResolvedValue(mockAuth)
    vi.mocked(require('@/lib/supabase/server').createServerClient).mockReturnValue(mockSupabase)
  })

  describe('GET /api/settings', () => {
    it('should return user settings', async () => {
      const mockSettings = { digest_enabled: true, default_score_threshold: 80 }
      mockSupabase.from().maybeSingle.mockResolvedValue({ data: mockSettings, error: null })
      
      const request = new NextRequest('http://localhost/api/settings')
      const response = await GET()
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.settings).toEqual(mockSettings)
    })

    it('should return default settings when none exist', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue({ data: null, error: null })
      
      const response = await GET()
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.settings.digest_enabled).toBe(true)
      expect(data.settings.default_score_threshold).toBe(75)
    })

    it('should handle database errors', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })
      
      const response = await GET()
      expect(response.status).toBe(500)
    })

    it('should require authentication', async () => {
      vi.mocked(require('@/lib/middleware/auth').requireAuth).mockResolvedValue({
        error: { status: 401 },
        user: null
      })
      
      const response = await GET()
      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/settings', () => {
    it('should update existing settings', async () => {
      const existingSettings = { id: 'settings-1' }
      mockSupabase.from().maybeSingle.mockResolvedValue({ data: existingSettings, error: null })
      
      const updateData = { digest_enabled: false, default_score_threshold: 90 }
      const request = new NextRequest('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      
      const response = await PUT(request)
      expect(response.status).toBe(200)
    })

    it('should create new settings when none exist', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue({ data: null, error: null })
      
      const updateData = { digest_enabled: false }
      const request = new NextRequest('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      
      const response = await PUT(request)
      expect(response.status).toBe(200)
    })

    it('should validate request body', async () => {
      const request = new NextRequest('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ invalid_field: 'value' })
      })
      
      const response = await PUT(request)
      expect(response.status).toBe(400)
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/settings', {
        method: 'PUT',
        body: 'invalid-json'
      })
      
      const response = await PUT(request)
      expect(response.status).toBe(400)
    })

    it('should validate score threshold range', async () => {
      const request = new NextRequest('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ default_score_threshold: 150 })
      })
      
      const response = await PUT(request)
      expect(response.status).toBe(400)
    })
  })
})