// lib/rate-limit/types.ts
export interface RateLimitConfig {
  requests: number // Max requests allowed
  window: number // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number // Milliseconds until reset (only if blocked)
}

interface RequestLog {
  timestamps: number[] // Sliding window of request timestamps
}
