import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/profiles/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/middleware/auth')
vi.mock('@/lib/supabase/server')

describe('Profiles API', () => {
  const mockAuth = { error: null, user: { id: 'user-1' } }
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'profile-1' }, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null })
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(require('@/lib/middleware/auth').requireAuth).mockResolvedValue(mockAuth)
    vi.mocked(require('@/lib/supabase/server').createServerClient).mockReturnValue(mockSupabase)
  })

  describe('GET /api/profiles', () => {
    it('should return paginated profiles', async () => {
      const request = new NextRequest('http://localhost/api/profiles?page=1&limit=10')
      
      const response = await GET(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(data).toHaveProperty('pagination')
    })

    it('should handle pagination parameters', async () => {
      const request = new NextRequest('http://localhost/api/profiles?page=2&limit=5')
      
      await GET(request)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should require authentication', async () => {
      vi.mocked(require('@/lib/middleware/auth').requireAuth).mockResolvedValue({
        error: { status: 401 },
        user: null
      })
      
      const request = new NextRequest('http://localhost/api/profiles')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/profiles', () => {
    it('should create new profile', async () => {
      const profileData = { name: 'Test Profile', description: 'Test' }
      const request = new NextRequest('http://localhost/api/profiles', {
        method: 'POST',
        body: JSON.stringify(profileData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    it('should validate request body', async () => {
      const request = new NextRequest('http://localhost/api/profiles', {
        method: 'POST',
        body: JSON.stringify({})
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/profiles', {
        method: 'POST',
        body: 'invalid-json'
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
})