import { NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Rate limiting middleware for API routes
 * @param config Rate limit configuration
 * @returns Rate limit check function
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: Request): NextResponse | null => {
    const ip = getClientIP(request)
    const now = Date.now()
    const key = `${ip}:${new URL(request.url).pathname}`
    
    // Clean up expired entries
    if (rateLimitStore.size > 1000) {
      for (const [k, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
          rateLimitStore.delete(k)
        }
      }
    }
    
    const entry = rateLimitStore.get(key)
    
    if (!entry || now > entry.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return null
    }
    
    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0'
          }
        }
      )
    }
    
    // Increment counter
    entry.count++
    rateLimitStore.set(key, entry)
    
    return null
  }
}

/**
 * Extract client IP from request headers
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// Common rate limit configurations
export const rateLimits = {
  // General API endpoints
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  
  // Authentication endpoints
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
  
  // Global refresh endpoint
  globalRefresh: { windowMs: 5 * 60 * 1000, maxRequests: 3 }, // 3 requests per 5 minutes
  
  // Per-profile refresh
  profileRefresh: { windowMs: 60 * 1000, maxRequests: 10 } // 10 requests per minute
}
