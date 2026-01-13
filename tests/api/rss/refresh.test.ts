// tests/api/rss/refresh.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/rss/refresh/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/rss/refresh-helper', () => ({
  refreshChannels: vi.fn().mockResolvedValue({ success: true, channelsRefreshed: 0 })
}))

vi.mock('@/lib/supabase/server')

describe('POST /api/rss/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return success when refreshing channels', async () => {
    const request = new NextRequest('http://localhost/api/rss/refresh', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' }
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
