import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT, DELETE } from '@/app/api/profiles/[id]/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/middleware/auth')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/utils/validation')

describe('Profile by ID API', () => {
  const mockAuth = { error: null, user: { id: 'user-1' } }
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'profile-1' }, error: null })
    }))
  }
  const mockContext = { params: Promise.resolve({ id: 'valid-uuid' }) }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(require('@/lib/middleware/auth').requireAuth).mockResolvedValue(mockAuth)
    vi.mocked(require('@/lib/supabase/server').createServerClient).mockReturnValue(mockSupabase)
    vi.mocked(require('@/lib/utils/validation').isValidUUID).mockReturnValue(true)
  })

  describe('GET /api/profiles/[id]', () => {
    it('should return profile by ID', async () => {
      const request = new NextRequest('http://localhost/api/profiles/valid-uuid')
      
      const response = await GET(request, mockContext)
      expect(response.status).toBe(200)
    })

    it('should validate UUID', async () => {
      vi.mocked(require('@/lib/utils/validation').isValidUUID).mockReturnValue(false)
      
      const request = new NextRequest('http://localhost/api/profiles/invalid-id')
      const response = await GET(request, mockContext)
      
      expect(response.status).toBe(400)
    })

    it('should handle not found', async () => {
      mockSupabase.from().single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
      
      const request = new NextRequest('http://localhost/api/profiles/valid-uuid')
      const response = await GET(request, mockContext)
      
      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/profiles/[id]', () => {
    it('should update profile', async () => {
      const updateData = { name: 'Updated Profile' }
      const request = new NextRequest('http://localhost/api/profiles/valid-uuid', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      
      const response = await PUT(request, mockContext)
      expect(response.status).toBe(200)
    })

    it('should validate request body', async () => {
      const request = new NextRequest('http://localhost/api/profiles/valid-uuid', {
        method: 'PUT',
        body: JSON.stringify({ invalid: 'data' })
      })
      
      const response = await PUT(request, mockContext)
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/profiles/[id]', () => {
    it('should delete profile', async () => {
      mockSupabase.from().delete.mockResolvedValue({ error: null })
      
      const request = new NextRequest('http://localhost/api/profiles/valid-uuid', { method: 'DELETE' })
      const response = await DELETE(request, mockContext)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should handle delete errors', async () => {
      mockSupabase.from().delete.mockResolvedValue({ error: { message: 'Delete failed' } })
      
      const request = new NextRequest('http://localhost/api/profiles/valid-uuid', { method: 'DELETE' })
      const response = await DELETE(request, mockContext)
      
      expect(response.status).toBe(500)
    })
  })
})