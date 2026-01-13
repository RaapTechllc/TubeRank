// tests/api/rss/refresh-profile.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/rss/refresh/[profileId]/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/rss/refresh-helper', () => ({
  refreshChannels: vi.fn().mockResolvedValue({ success: true, channelsRefreshed: 0 })
}))

vi.mock('@/lib/supabase/server')

describe('POST /api/rss/refresh/[profileId]', () => {
  const profileId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return success when refreshing profile channels', async () => {
    const request = new NextRequest(
      `http://localhost/api/rss/refresh/${profileId}`,
      {
        method: 'POST',
        headers: { 'x-forwarded-for': '1.2.3.4' }
      }
    )

    const response = await POST(request, { params: Promise.resolve({ profileId }) })
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('should reject invalid profile ID', async () => {
    const invalidId = 'not-a-uuid'
    const request = new NextRequest(
      `http://localhost/api/rss/refresh/${invalidId}`,
      {
        method: 'POST',
        headers: { 'x-forwarded-for': '1.2.3.4' }
      }
    )

    const response = await POST(request, { params: Promise.resolve({ profileId: invalidId }) })
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Invalid profile ID')
  })
})
