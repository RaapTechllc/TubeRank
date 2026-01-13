import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PATCH } from '@/app/api/cards/[id]/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/middleware/auth')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/utils/validation')

describe('Cards API', () => {
  const mockAuth = { error: null, user: { id: 'user-1' } }
  const mockSupabase = {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'card-1' }, error: null })
    }))
  }
  const mockContext = { params: Promise.resolve({ id: 'valid-uuid' }) }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(require('@/lib/middleware/auth').requireAuth).mockResolvedValue(mockAuth)
    vi.mocked(require('@/lib/supabase/server').createServerClient).mockReturnValue(mockSupabase)
    vi.mocked(require('@/lib/utils/validation').isValidUUID).mockReturnValue(true)
  })

  describe('PATCH /api/cards/[id]', () => {
    it('should update card status', async () => {
      const updateData = { column_status: 'watch' as const }
      const request = new NextRequest('http://localhost/api/cards/valid-uuid', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })
      
      const response = await PATCH(request, mockContext)
      expect(response.status).toBe(200)
    })

    it('should update card position', async () => {
      const updateData = { position: 5 }
      const request = new NextRequest('http://localhost/api/cards/valid-uuid', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })
      
      const response = await PATCH(request, mockContext)
      expect(response.status).toBe(200)
    })

    it('should validate card ID', async () => {
      vi.mocked(require('@/lib/utils/validation').isValidUUID).mockReturnValue(false)
      
      const request = new NextRequest('http://localhost/api/cards/invalid-id', {
        method: 'PATCH',
        body: JSON.stringify({ column_status: 'watch' })
      })
      
      const response = await PATCH(request, mockContext)
      expect(response.status).toBe(400)
    })

    it('should validate request body', async () => {
      const request = new NextRequest('http://localhost/api/cards/valid-uuid', {
        method: 'PATCH',
        body: JSON.stringify({ invalid_field: 'value' })
      })
      
      const response = await PATCH(request, mockContext)
      expect(response.status).toBe(400)
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/cards/valid-uuid', {
        method: 'PATCH',
        body: 'invalid-json'
      })
      
      const response = await PATCH(request, mockContext)
      expect(response.status).toBe(400)
    })

    it('should require authentication', async () => {
      vi.mocked(require('@/lib/middleware/auth').requireAuth).mockResolvedValue({
        error: { status: 401 },
        user: null
      })
      
      const request = new NextRequest('http://localhost/api/cards/valid-uuid', {
        method: 'PATCH',
        body: JSON.stringify({ column_status: 'watch' })
      })
      
      const response = await PATCH(request, mockContext)
      expect(response.status).toBe(401)
    })
  })
})