// tests/rate-limit/limiter.test.ts
import { RateLimiter } from '@/lib/rate-limit/limiter'

describe('RateLimiter', () => {
  it('should allow requests within limit', async () => {
    const limiter = new RateLimiter({ requests: 3, window: 60000 })

    expect(await limiter.check('test-key')).toEqual({ allowed: true, remaining: 2 })
    expect(await limiter.check('test-key')).toEqual({ allowed: true, remaining: 1 })
    expect(await limiter.check('test-key')).toEqual({ allowed: true, remaining: 0 })
  })

  it('should block requests exceeding limit', async () => {
    const limiter = new RateLimiter({ requests: 2, window: 60000 })

    await limiter.check('test-key')
    await limiter.check('test-key')

    const result = await limiter.check('test-key')
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('should reset after window expires', async () => {
    const limiter = new RateLimiter({ requests: 1, window: 100 })

    await limiter.check('test-key')
    await new Promise(r => setTimeout(r, 150))

    const result = await limiter.check('test-key')
    expect(result.allowed).toBe(true)
  })

  it('should handle multiple keys independently', async () => {
    const limiter = new RateLimiter({ requests: 1, window: 60000 })

    await limiter.check('key-1')
    const result = await limiter.check('key-2')

    expect(result.allowed).toBe(true)
  })
})
