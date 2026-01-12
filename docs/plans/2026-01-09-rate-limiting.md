# Rate Limiting for Refresh APIs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add rate limiting to refresh APIs to prevent abuse of manual RSS feed refresh endpoints

**Architecture:** In-memory sliding window rate limiter using Map with automatic cleanup, middleware pattern for reusability, configurable limits per endpoint

**Tech Stack:** TypeScript, Next.js App Router, in-memory Map (no external deps)

---

## Task 1: Rate Limiter Core Implementation

**Files:**
- Create: `lib/rate-limit/limiter.ts`
- Create: `lib/rate-limit/types.ts`

**Step 1: Write the failing test**

Create test file to verify rate limiter behavior:

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/rate-limit/limiter.test.ts`
Expected: FAIL with "Cannot find module '@/lib/rate-limit/limiter'"

**Step 3: Write types definition**

```typescript
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
```

**Step 4: Write minimal rate limiter implementation**

```typescript
// lib/rate-limit/limiter.ts
import { RateLimitConfig, RateLimitResult } from './types'

export class RateLimiter {
  private store = new Map<string, number[]>()
  private config: RateLimitConfig
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: RateLimitConfig) {
    this.config = config
    this.startCleanup()
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.window

    // Get existing timestamps, filter expired
    const timestamps = (this.store.get(key) || [])
      .filter(ts => ts > windowStart)

    // Check if limit exceeded
    if (timestamps.length >= this.config.requests) {
      const oldestTimestamp = timestamps[0]
      const retryAfter = oldestTimestamp + this.config.window - now

      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil(retryAfter)
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

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}
```

**Step 5: Run test to verify it passes**

Run: `npm test tests/rate-limit/limiter.test.ts`
Expected: PASS (all 4 tests)

**Step 6: Commit**

```bash
git add lib/rate-limit/limiter.ts lib/rate-limit/types.ts tests/rate-limit/limiter.test.ts
git commit -m "feat: add core rate limiter with sliding window algorithm

- In-memory Map storage with automatic cleanup
- Sliding window for accurate rate limiting
- Support for multiple independent keys
- Auto-cleanup of expired entries every 60s"
```

---

## Task 2: Rate Limit Middleware

**Files:**
- Create: `lib/rate-limit/middleware.ts`
- Create: `lib/rate-limit/config.ts`

**Step 1: Write the failing test**

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/rate-limit/middleware.test.ts`
Expected: FAIL with "Cannot find module '@/lib/rate-limit/middleware'"

**Step 3: Write config file**

```typescript
// lib/rate-limit/config.ts
import { RateLimitConfig } from './types'

export const RATE_LIMITS = {
  // Global refresh: 3 requests per 5 minutes
  GLOBAL_REFRESH: {
    requests: 3,
    window: 5 * 60 * 1000
  } as RateLimitConfig,

  // Per-profile refresh: 10 requests per minute
  PROFILE_REFRESH: {
    requests: 10,
    window: 60 * 1000
  } as RateLimitConfig
}
```

**Step 4: Write middleware implementation**

```typescript
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
    return forwarded.split(',')[0].trim()
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
```

**Step 5: Run test to verify it passes**

Run: `npm test tests/rate-limit/middleware.test.ts`
Expected: PASS (all 3 tests)

**Step 6: Commit**

```bash
git add lib/rate-limit/middleware.ts lib/rate-limit/config.ts tests/rate-limit/middleware.test.ts
git commit -m "feat: add rate limit middleware with IP-based identification

- Higher-order function wrapper for route handlers
- IP identification from x-forwarded-for header
- Standard rate limit response headers
- Singleton limiter instances per config"
```

---

## Task 3: Apply Rate Limiting to Global Refresh API

**Files:**
- Modify: `app/api/rss/refresh/route.ts:1-65`

**Step 1: Write integration test**

```typescript
// tests/api/rss/refresh.test.ts
import { POST } from '@/app/api/rss/refresh/route'
import { NextRequest } from 'next/server'

describe('POST /api/rss/refresh', () => {
  it('should enforce rate limiting', async () => {
    const createRequest = () => new NextRequest('http://localhost/api/rss/refresh', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' }
    })

    // First 3 requests should succeed
    for (let i = 0; i < 3; i++) {
      const response = await POST(createRequest())
      expect(response.status).not.toBe(429)
    }

    // 4th request should be rate limited
    const response = await POST(createRequest())
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeTruthy()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/api/rss/refresh.test.ts`
Expected: FAIL (4th request returns 200 instead of 429)

**Step 3: Apply rate limiting to route**

```typescript
// app/api/rss/refresh/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enqueueJob, checkPendingJob } from '@/lib/jobs/queue'
import { withRateLimit } from '@/lib/rate-limit/middleware'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

async function handlePOST() {
  const supabase = createServerClient()

  try {
    // Query all distinct channels from active profiles
    const { data: sources, error } = await supabase
      .from('profile_sources')
      .select('source_value, profiles!inner(is_active)')
      .eq('source_type', 'channel')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch channels' },
        { status: 500 }
      )
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json({ enqueued: 0, skipped: 0 })
    }

    // Get unique channels from active profiles
    const channels = Array.from(
      new Set(
        sources
          // @ts-ignore - Supabase join type
          .filter(s => s.profiles?.is_active)
          .map(s => s.source_value)
      )
    )

    let enqueued = 0
    let skipped = 0

    // Enqueue jobs
    for (const channelId of channels) {
      // Check if job already pending/running
      const hasPending = await checkPendingJob('rss_fetch_channel', channelId)

      if (hasPending) {
        skipped++
        continue
      }

      // Enqueue new job
      await enqueueJob('rss_fetch_channel', {
        channel_youtube_id: channelId,
        triggered_by: 'manual'
      })
      enqueued++
    }

    return NextResponse.json({ enqueued, skipped })
  } catch (error) {
    console.error('Global refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// Export rate-limited handler
export const POST = withRateLimit(handlePOST, RATE_LIMITS.GLOBAL_REFRESH)
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/api/rss/refresh.test.ts`
Expected: PASS

**Step 5: Manual test in development**

Run: `npm run dev`

```bash
# First 3 requests should succeed
curl -X POST http://localhost:3000/api/rss/refresh
curl -X POST http://localhost:3000/api/rss/refresh
curl -X POST http://localhost:3000/api/rss/refresh

# 4th request should return 429
curl -v -X POST http://localhost:3000/api/rss/refresh
```

Expected: 4th curl shows `HTTP/1.1 429 Too Many Requests` with `Retry-After` header

**Step 6: Commit**

```bash
git add app/api/rss/refresh/route.ts tests/api/rss/refresh.test.ts
git commit -m "feat: add rate limiting to global refresh API

- Limit: 3 requests per 5 minutes per IP
- Returns 429 with Retry-After header when exceeded
- Prevents abuse of manual refresh endpoint"
```

---

## Task 4: Apply Rate Limiting to Per-Profile Refresh API

**Files:**
- Modify: `app/api/rss/refresh/[profileId]/route.ts:1-73`

**Step 1: Write integration test**

```typescript
// tests/api/rss/refresh-profile.test.ts
import { POST } from '@/app/api/rss/refresh/[profileId]/route'
import { NextRequest } from 'next/server'

describe('POST /api/rss/refresh/[profileId]', () => {
  const profileId = '123e4567-e89b-12d3-a456-426614174000'

  it('should enforce rate limiting', async () => {
    const createRequest = () => new NextRequest(
      `http://localhost/api/rss/refresh/${profileId}`,
      {
        method: 'POST',
        headers: { 'x-forwarded-for': '1.2.3.4' }
      }
    )

    // First 10 requests should succeed (or return 400 for invalid profile, but not 429)
    for (let i = 0; i < 10; i++) {
      const response = await POST(createRequest(), { params: Promise.resolve({ profileId }) })
      expect(response.status).not.toBe(429)
    }

    // 11th request should be rate limited
    const response = await POST(createRequest(), { params: Promise.resolve({ profileId }) })
    expect(response.status).toBe(429)
  })

  it('should use different limits per profile', async () => {
    const profileId1 = '123e4567-e89b-12d3-a456-426614174000'
    const profileId2 = '223e4567-e89b-12d3-a456-426614174000'

    const createRequest = (id: string) => new NextRequest(
      `http://localhost/api/rss/refresh/${id}`,
      {
        method: 'POST',
        headers: { 'x-forwarded-for': '1.2.3.4' }
      }
    )

    // Exhaust limit for profile 1
    for (let i = 0; i < 10; i++) {
      await POST(createRequest(profileId1), { params: Promise.resolve({ profileId: profileId1 }) })
    }

    // Profile 2 should still work
    const response = await POST(createRequest(profileId2), { params: Promise.resolve({ profileId: profileId2 }) })
    expect(response.status).not.toBe(429)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/api/rss/refresh-profile.test.ts`
Expected: FAIL (11th request doesn't return 429)

**Step 3: Update middleware to support dynamic keys**

First, enhance middleware to support custom key generation:

```typescript
// lib/rate-limit/middleware.ts (add to existing file)
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
```

**Step 4: Apply rate limiting to per-profile route**

```typescript
// app/api/rss/refresh/[profileId]/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enqueueJob, checkPendingJob } from '@/lib/jobs/queue'
import { isValidUUID } from '@/lib/utils/validation'
import { withRateLimitByKey } from '@/lib/rate-limit/middleware'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

async function handlePOST(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await context.params

  // Validate profileId
  if (!isValidUUID(profileId)) {
    return NextResponse.json(
      { error: 'Invalid profile ID' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  try {
    // Query channels for this profile
    const { data: sources, error } = await supabase
      .from('profile_sources')
      .select('source_value')
      .eq('profile_id', profileId)
      .eq('source_type', 'channel')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch channels' },
        { status: 500 }
      )
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json({ enqueued: 0, skipped: 0 })
    }

    let enqueued = 0
    let skipped = 0

    // Enqueue jobs
    for (const source of sources) {
      const channelId = source.source_value

      // Check if job already pending/running
      const hasPending = await checkPendingJob('rss_fetch_channel', channelId)

      if (hasPending) {
        skipped++
        continue
      }

      // Enqueue new job
      await enqueueJob('rss_fetch_channel', {
        channel_youtube_id: channelId,
        triggered_by: 'manual'
      })
      enqueued++
    }

    return NextResponse.json({ enqueued, skipped })
  } catch (error) {
    console.error('Per-profile refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// Export rate-limited handler with profile-specific keys
export const POST = withRateLimitByKey(
  handlePOST,
  RATE_LIMITS.PROFILE_REFRESH,
  (_, context) => {
    // Extract profileId from context to create per-profile rate limits
    return context?.params?.profileId || 'unknown'
  }
)
```

**Step 5: Run test to verify it passes**

Run: `npm test tests/api/rss/refresh-profile.test.ts`
Expected: PASS (both tests)

**Step 6: Manual test in development**

Run: `npm run dev`

```bash
PROFILE_ID="your-profile-id-here"

# First 10 requests should succeed
for i in {1..10}; do
  curl -X POST "http://localhost:3000/api/rss/refresh/$PROFILE_ID"
done

# 11th request should return 429
curl -v -X POST "http://localhost:3000/api/rss/refresh/$PROFILE_ID"
```

Expected: 11th curl shows `HTTP/1.1 429 Too Many Requests`

**Step 7: Commit**

```bash
git add app/api/rss/refresh/[profileId]/route.ts lib/rate-limit/middleware.ts tests/api/rss/refresh-profile.test.ts
git commit -m "feat: add rate limiting to per-profile refresh API

- Limit: 10 requests per minute per IP per profile
- Independent rate limits for each profile
- Uses composite key (IP:profileId) for granular control"
```

---

## Task 5: Documentation and Environment Variables

**Files:**
- Modify: `README.md` (add rate limiting section)
- Modify: `DEVLOG.md` (update follow-ups)
- Modify: `.env.local.example` (if adding configurable limits)

**Step 1: Update README with rate limiting information**

Add after the RSS Ingestion section:

```markdown
## Rate Limiting

Manual refresh endpoints are rate-limited to prevent abuse:

**Global Refresh** (`/api/rss/refresh`):
- Limit: 3 requests per 5 minutes per IP address
- Scope: All channel refreshes across all profiles

**Per-Profile Refresh** (`/api/rss/refresh/[profileId]`):
- Limit: 10 requests per minute per IP address per profile
- Scope: Individual profile's channels

**Rate Limit Headers:**
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `Retry-After`: Seconds until rate limit resets (only when blocked)

**429 Response:**
```json
{
  "error": "Too many requests. Please try again later."
}
```

**Implementation:**
- In-memory sliding window algorithm
- IP-based identification (x-forwarded-for header)
- Automatic cleanup of expired entries
- No external dependencies required
```

**Step 2: Update DEVLOG.md**

Remove the rate limiting TODO and add implementation notes:

```markdown
### Follow-ups / TODOs
- [x] Add rate limiting to refresh APIs ✅ 2026-01-09
- [ ] Apply database migration in Supabase SQL Editor
- [ ] Add toast notifications for refresh actions
- [ ] Show last_checked_at timestamps in UI
- [ ] Set up Vercel Cron or external cron service for production
- [ ] Consider YouTube Data API enrichment for view counts/stats

### Technical Notes (add to existing section)
- **Rate limiting pattern**: In-memory Map with sliding window, IP-based keys via x-forwarded-for
- **Rate limit middleware**: Higher-order function wrapper, supports custom key extraction for per-resource limits
- **Cleanup strategy**: setInterval every 60s to remove expired entries, prevents memory leaks
```

**Step 3: Add optional environment configuration**

If you want to make rate limits configurable (optional enhancement):

```typescript
// lib/rate-limit/config.ts
import { RateLimitConfig } from './types'

export const RATE_LIMITS = {
  GLOBAL_REFRESH: {
    requests: parseInt(process.env.RATE_LIMIT_GLOBAL_REQUESTS || '3', 10),
    window: parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW || String(5 * 60 * 1000), 10)
  } as RateLimitConfig,

  PROFILE_REFRESH: {
    requests: parseInt(process.env.RATE_LIMIT_PROFILE_REQUESTS || '10', 10),
    window: parseInt(process.env.RATE_LIMIT_PROFILE_WINDOW || String(60 * 1000), 10)
  } as RateLimitConfig
}
```

And update `.env.local.example`:

```bash
# Rate Limiting (optional overrides)
# RATE_LIMIT_GLOBAL_REQUESTS=3
# RATE_LIMIT_GLOBAL_WINDOW=300000  # 5 minutes in ms
# RATE_LIMIT_PROFILE_REQUESTS=10
# RATE_LIMIT_PROFILE_WINDOW=60000  # 1 minute in ms
```

**Step 4: Commit documentation**

```bash
git add README.md DEVLOG.md .env.local.example lib/rate-limit/config.ts
git commit -m "docs: add rate limiting documentation and optional env config

- Document rate limits and headers in README
- Mark rate limiting TODO as complete in DEVLOG
- Add optional environment variable overrides
- Include 429 response format example"
```

---

## Task 6: Production Considerations

**Files:**
- Create: `docs/rate-limiting.md` (detailed documentation)

**Step 1: Create comprehensive documentation**

```markdown
# Rate Limiting Architecture

## Overview

TubeRank implements in-memory rate limiting to protect manual RSS refresh endpoints from abuse without requiring external services like Redis.

## Implementation

**Algorithm:** Sliding window with in-memory Map storage

**Identification:** IP-based via `x-forwarded-for` header

**Storage:** Node.js Map with automatic cleanup every 60 seconds

## Endpoints and Limits

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| `/api/rss/refresh` | 3 requests | 5 minutes | Global (all profiles) |
| `/api/rss/refresh/[profileId]` | 10 requests | 1 minute | Per profile |

## Design Decisions

**Why in-memory instead of Redis?**
- Zero infrastructure dependencies
- Sufficient for single-instance deployments
- Auto-cleanup prevents memory leaks
- Sliding window provides accurate limits

**Why IP-based?**
- No authentication implemented yet
- Simple and effective for public endpoints
- Works with standard proxy headers

**Limitations:**
- **Multi-instance deployments**: Each instance has independent limits
- **Restarts reset limits**: In-memory state is lost on restart
- **IP spoofing**: Relies on trusted proxy headers

## Future Enhancements

**For multi-instance production:**
1. Migrate to Redis/Upstash for shared state
2. Consider distributed rate limiting (e.g., Upstash Rate Limit SDK)
3. Add user-based limits when authentication is implemented

**Monitoring:**
1. Log rate limit violations
2. Alert on excessive 429 responses
3. Track per-IP usage patterns

## Testing

**Unit tests:** `tests/rate-limit/limiter.test.ts`
**Integration tests:** `tests/api/rss/*.test.ts`

**Manual testing:**
```bash
# Test global refresh limit
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/rss/refresh
  echo "Request $i"
done

# Test per-profile limit
PROFILE_ID="uuid-here"
for i in {1..11}; do
  curl -X POST "http://localhost:3000/api/rss/refresh/$PROFILE_ID"
  echo "Request $i"
done
```

## Environment Configuration

Rate limits can be customized via environment variables:

```bash
RATE_LIMIT_GLOBAL_REQUESTS=3
RATE_LIMIT_GLOBAL_WINDOW=300000  # milliseconds
RATE_LIMIT_PROFILE_REQUESTS=10
RATE_LIMIT_PROFILE_WINDOW=60000
```

## Headers

**Response Headers:**
- `X-RateLimit-Remaining`: Requests remaining in current window
- `Retry-After`: Seconds until limit resets (429 only)

**Request Headers (used for identification):**
- `x-forwarded-for`: Client IP (preferred)
- `x-real-ip`: Fallback IP header
```

**Step 2: Commit documentation**

```bash
git add docs/rate-limiting.md
git commit -m "docs: add comprehensive rate limiting architecture documentation

- Design decisions and trade-offs
- Multi-instance production considerations
- Testing procedures and examples
- Future enhancement roadmap"
```

---

## Testing Checklist

After implementation, verify:

- [ ] Unit tests pass: `npm test tests/rate-limit/limiter.test.ts`
- [ ] Middleware tests pass: `npm test tests/rate-limit/middleware.test.ts`
- [ ] Global refresh integration test passes
- [ ] Per-profile refresh integration test passes
- [ ] Manual curl tests demonstrate rate limiting
- [ ] 429 responses include correct headers
- [ ] Different IPs get independent limits
- [ ] Different profiles get independent limits
- [ ] Memory cleanup runs without errors
- [ ] No rate limiting on first requests
- [ ] Limits reset after window expires

## Deployment Notes

**Vercel/Serverless:**
- In-memory limits work per instance
- Cold starts reset limits (acceptable trade-off)
- Consider Upstash for multi-region deployments

**Environment Variables:**
- Optional: Configure via env vars for flexibility
- Defaults are sensible for most use cases

**Monitoring:**
- Watch for excessive 429 responses
- Consider logging violations for analysis
- Track per-endpoint usage patterns

---

**Total Files Created:** 9
**Total Files Modified:** 4
**Estimated Lines:** ~600 lines (code + tests + docs)
**External Dependencies:** 0 (pure TypeScript/Next.js)
