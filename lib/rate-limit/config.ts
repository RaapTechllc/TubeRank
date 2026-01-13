// lib/rate-limit/config.ts
import { RateLimitConfig } from './types'
import { getEnv } from '@/lib/config/env'

export const RATE_LIMITS = {
  API: {
    requests: 100,
    window: 60 * 1000 // 100 requests per minute
  } as RateLimitConfig,

  GLOBAL_REFRESH: {
    get requests() { return getEnv().RATE_LIMIT_GLOBAL_REQUESTS },
    get window() { return getEnv().RATE_LIMIT_GLOBAL_WINDOW }
  } as RateLimitConfig,

  PROFILE_REFRESH: {
    get requests() { return getEnv().RATE_LIMIT_PROFILE_REQUESTS },
    get window() { return getEnv().RATE_LIMIT_PROFILE_WINDOW }
  } as RateLimitConfig
}
