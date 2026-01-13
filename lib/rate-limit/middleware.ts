// lib/rate-limit/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from './limiter'
import { RateLimitConfig } from './types'

// Singleton limiters per config
const limiters = new Map<string, RateLimiter>()

function getLimiter(config: RateLimitConfig): RateLimiter {
  const key = `${config.requests}-${config.window}`

  if (!limiters.has(key)) {
    limiters.set(key, new RateLimiter(config))
  }

  return limiters.get(key)!
}

function getClientIdentifier(request: NextRequest): string {
  // Try various headers in order of preference
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',')
    if (ips[0]) {
      return ips[0].trim()
    }
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to connection IP (won't exist in edge/serverless)
  return 'unknown'
}

export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const limiter = getLimiter(config)
    const identifier = getClientIdentifier(request)

    const result = await limiter.check(identifier)

    if (!result.allowed) {
      const response = NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )

      response.headers.set('X-RateLimit-Remaining', '0')

      if (result.retryAfter) {
        response.headers.set('Retry-After', Math.ceil(result.retryAfter / 1000).toString())
      }

      return response
    }

    // Call original handler
    const response = await handler(request, context)

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())

    return response
  }
}

export function withRateLimitByKey(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: RateLimitConfig,
  keyExtractor: (request: NextRequest, context?: any) => string
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const limiter = getLimiter(config)
    const identifier = getClientIdentifier(request)
    const customKey = keyExtractor(request, context)
    const key = `${identifier}:${customKey}`

    const result = await limiter.check(key)

    if (!result.allowed) {
      const response = NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )

      response.headers.set('X-RateLimit-Remaining', '0')

      if (result.retryAfter) {
        response.headers.set('Retry-After', Math.ceil(result.retryAfter / 1000).toString())
      }

      return response
    }

    const response = await handler(request, context)
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())

    return response
  }
}
