import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/profiles/route'
import { createServerClient } from '@/lib/supabase/server'

// Mock Supabase
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/middleware/auth')

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        data: [{ id: '1', name: 'Test Profile' }],
        error: null
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { id: '1', name: 'New Profile' },
          error: null
        }))
      }))
    }))
  }))
}

describe('/api/profiles', () => {
  beforeEach(() => {
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)
    // Mock auth to return success
    vi.doMock('@/lib/middleware/auth', () => ({
      requireAuth: vi.fn(() => ({ error: null, user: { id: 'user1' } }))
    }))
  })

  describe('GET /api/profiles', () => {
    it('should return profiles list', async () => {
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual([{ id: '1', name: 'Test Profile' }])
    })
  })

  describe('POST /api/profiles', () => {
    it('should create new profile', async () => {
      const request = new NextRequest('http://localhost/api/profiles', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Profile', description: 'Test' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data).toEqual({ id: '1', name: 'New Profile' })
    })

    it('should validate input data', async () => {
      const request = new NextRequest('http://localhost/api/profiles', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' })
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })
  })
})
