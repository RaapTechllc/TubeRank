import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PATCH, DELETE } from '@/app/api/cards/batch/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/middleware/auth')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/card-service')

describe('Batch Cards API', () => {
  const mockAuth = { error: null, user: { id: 'user-1' } }
  const mockSupabase = {}
  const mockCardService = {
    batchMoveCards: vi.fn().mockResolvedValue([{ id: 'card-1' }]),
    batchUpdateCards: vi.fn().mockResolvedValue([{ id: 'card-2' }]),
    batchDeleteCards: vi.fn().mockResolvedValue(2)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(require('@/lib/middleware/auth').requireAuth).mockResolvedValue(mockAuth)
    vi.mocked(require('@/lib/supabase/server').createServerClient).mockReturnValue(mockSupabase)
    vi.mocked(require('@/lib/services/card-service').CardService).mockImplementation(() => mockCardService)
  })

  describe('PATCH /api/cards/batch', () => {
    it('should batch update cards', async () => {
      const updateData = {
        updates: [
          { cardId: 'card-1', columnStatus: 'watch' as const, position: 1 },
          { cardId: 'card-2', position: 2 }
        ]
      }
      const request = new NextRequest('http://localhost/api/cards/batch', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })
      
      const response = await PATCH(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.updated).toBe(2)
    })

    it('should validate batch size', async () => {
      const updates = Array.from({ length: 101 }, (_, i) => ({
        cardId: `card-${i}`,
        position: i
      }))
      
      const request = new NextRequest('http://localhost/api/cards/batch', {
        method: 'PATCH',
        body: JSON.stringify({ updates })
      })
      
      const response = await PATCH(request)
      expect(response.status).toBe(400)
    })

    it('should validate card IDs', async () => {
      const updateData = {
        updates: [{ cardId: 'invalid-uuid', position: 1 }]
      }
      const request = new NextRequest('http://localhost/api/cards/batch', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })
      
      const response = await PATCH(request)
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/cards/batch', () => {
    it('should batch delete cards', async () => {
      const deleteData = {
        cardIds: ['card-1', 'card-2']
      }
      const request = new NextRequest('http://localhost/api/cards/batch', {
        method: 'DELETE',
        body: JSON.stringify(deleteData)
      })
      
      const response = await DELETE(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.deleted).toBe(2)
    })

    it('should validate delete batch size', async () => {
      const cardIds = Array.from({ length: 101 }, (_, i) => `card-${i}`)
      
      const request = new NextRequest('http://localhost/api/cards/batch', {
        method: 'DELETE',
        body: JSON.stringify({ cardIds })
      })
      
      const response = await DELETE(request)
      expect(response.status).toBe(400)
    })
  })
})