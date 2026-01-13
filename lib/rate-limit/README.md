# Rate Limiting Configuration

These values can be overridden via environment variables if needed.

## Environment Variables

- `RATE_LIMIT_GLOBAL_REQUESTS`: Max requests for global refresh (default: 3)
- `RATE_LIMIT_GLOBAL_WINDOW`: Time window in milliseconds for global refresh (default: 300000 = 5 minutes)
- `RATE_LIMIT_PROFILE_REQUESTS`: Max requests per profile (default: 10)
- `RATE_LIMIT_PROFILE_WINDOW`: Time window in milliseconds per profile (default: 60000 = 1 minute)
