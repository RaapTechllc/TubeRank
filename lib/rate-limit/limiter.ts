// lib/rate-limit/limiter.ts
import { RateLimitConfig, RateLimitResult } from './types'

/**
 * Rate limiter using sliding window algorithm
 * Thread-safe for single-process environments
 * Use Redis for distributed environments
 */
export class RateLimiter {
  private store = new Map<string, number[]>()
  private config: RateLimitConfig
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: RateLimitConfig) {
    this.config = config
    this.startCleanup()
  }

  /**
   * Check if request is allowed and update tracking
   * @param key - Unique identifier (e.g., IP address)
   * @returns Rate limit result
   */
  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.window

    // Get existing timestamps, filter expired
    const timestamps = (this.store.get(key) || [])
      .filter(ts => ts > windowStart)

    // Check if limit exceeded
    if (timestamps.length >= this.config.requests) {
      const oldestTimestamp = timestamps[0]
      if (oldestTimestamp) {
        const retryAfter = oldestTimestamp + this.config.window - now

        return {
          allowed: false,
          remaining: 0,
          retryAfter: Math.ceil(retryAfter)
        }
      }
    }

    // Add current request
    timestamps.push(now)
    this.store.set(key, timestamps)

    return {
      allowed: true,
      remaining: this.config.requests - timestamps.length
    }
  }

  /**
   * Clean up expired entries periodically
   */
  private startCleanup() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      const windowStart = now - this.config.window

      for (const [key, timestamps] of this.store.entries()) {
        const validTimestamps = timestamps.filter(ts => ts > windowStart)

        if (validTimestamps.length === 0) {
          this.store.delete(key)
        } else {
          this.store.set(key, validTimestamps)
        }
      }
    }, 60000) // Run every minute
  }

  /**
   * Clean up interval on destroy
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}
