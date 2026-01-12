import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST as RefreshProfilePOST } from '@/app/api/rss/refresh/[profileId]/route'
import { POST as RefreshPOST } from '@/app/api/rss/refresh/route'
import { refreshChannels } from '@/lib/rss/refresh-helper'
import { isValidUUID } from '@/lib/utils/validation'
import { NextRequest } from 'next/server'

vi.mock('@/lib/rss/refresh-helper')
vi.mock('@/lib/utils/validation')
vi.mock('@/lib/supabase/server')

describe('RSS Refresh API', () => {
  let mockRequest: NextRequest
  let mockContext: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequest = new NextRequest('http://localhost:3000/api/rss/refresh', { method: 'POST' })
    mockContext = { params: Promise.resolve({ profileId: '123e4567-e89b-12d3-a456-426614174000' }) }
  })

  describe('Global Refresh', () => {
    it('should call refreshChannels without profileId', async () => {
      const mockRefreshChannels = vi.mocked(refreshChannels)
      mockRefreshChannels.mockResolvedValue({ enqueued: 5, skipped: 2 })

      const response = await RefreshPOST(mockRequest)

      expect(mockRefreshChannels).toHaveBeenCalled()
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toEqual({ enqueued: 5, skipped: 2 })
    })

    it('should handle errors gracefully', async () => {
      const mockRefreshChannels = vi.mocked(refreshChannels)
      mockRefreshChannels.mockRejectedValue(new Error('Database error'))

      const response = await RefreshPOST(mockRequest)

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('Database error')
    })
  })

  describe('Profile Refresh', () => {
    it('should validate profileId', async () => {
      const mockIsValidUUID = vi.mocked(isValidUUID)
      mockIsValidUUID.mockReturnValue(false)

      const response = await RefreshProfilePOST(mockRequest, mockContext)

      expect(mockIsValidUUID).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')
      expect(response.status).toBe(400)
    })

    it('should call refreshChannels with profileId', async () => {
      const mockIsValidUUID = vi.mocked(isValidUUID)
      const mockRefreshChannels = vi.mocked(refreshChannels)
      mockIsValidUUID.mockReturnValue(true)
      mockRefreshChannels.mockResolvedValue({ enqueued: 3, skipped: 0 })

      const response = await RefreshProfilePOST(mockRequest, mockContext)

      expect(mockRefreshChannels).toHaveBeenCalledWith({ profileId: '123e4567-e89b-12d3-a456-426614174000' })
      expect(response.status).toBe(200)
    })
  })
})
