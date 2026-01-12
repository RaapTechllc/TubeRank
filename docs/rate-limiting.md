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
