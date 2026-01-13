// tests/rate-limit/middleware.test.ts
import { NextRequest } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit/middleware'
import { NextResponse } from 'next/server'

describe('withRateLimit middleware', () => {
  it('should allow requests within limit', async () => {
    const handler = async () => NextResponse.json({ success: true })
    const wrapped = withRateLimit(handler, { requests: 5, window: 60000 })

    const request = new NextRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' }
    })

    const response = await wrapped(request)
    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4')
  })

  it('should block requests exceeding limit', async () => {
    const handler = async () => NextResponse.json({ success: true })
    const wrapped = withRateLimit(handler, { requests: 1, window: 60000 })

    const request = new NextRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' }
    })

    await wrapped(request)
    const response = await wrapped(request)

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeTruthy()
  })

  it('should use different keys for different IPs', async () => {
    const handler = async () => NextResponse.json({ success: true })
    const wrapped = withRateLimit(handler, { requests: 1, window: 60000 })

    const req1 = new NextRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' }
    })
    const req2 = new NextRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '5.6.7.8' }
    })

    await wrapped(req1)
    const response = await wrapped(req2)

    expect(response.status).toBe(200)
  })
})
