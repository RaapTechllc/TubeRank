# TubeRank

YouTube content intelligence dashboard for triaging and curating video content through RSS feeds.

## Features

- **Profile Management**: Create and manage multiple content curation profiles
- **Responsive Kanban Board**: Triage videos across 5 columns with mobile-optimized layout and touch support
- **Digest Page**: Centralized view of high-scoring videos and content highlights across all profiles
- **Settings Page**: Configure user preferences, notifications, and data management options
- **RSS Ingestion**: Automatic YouTube channel feed ingestion via RSS (no API quota needed)
- **Manual Refresh**: Trigger feed updates on-demand from dashboard or profile pages with rate limiting
- **Job Queue**: Resilient background processing with retry logic and parallel execution
- **Error Alerts**: User-visible notifications when feeds fail after max retries
- **Performance Optimized**: Batch operations, database indexing, and N+1 query elimination
- **Security Hardened**: Authentication middleware, timing-safe comparisons, and rate limiting protection

## Ralph Loop Multi-Agent System

This project uses a Ralph Loop multi-agent system for autonomous development. Each specialized agent works in parallel to complete assigned tasks.

### Quick Start

1. **Start the full system:**
   ```bash
   ./scripts/run-orchestrator.sh
   ```

2. **Monitor progress:**
   ```bash
   tail -f PROGRESS.md
   ```

3. **View agent activity:**
   ```bash
   git log --oneline --grep="\\[.*\\]"
   ```

### Available Agents

| Agent | Responsibilities | Tasks Assigned | Tasks Completed |
|-------|------------------|----------------|-----------------|
| `code-surgeon` | Security fixes, auth, performance | 4 tasks | 4/4 ✅ |
| `db-wizard` | Database optimization, queries | 5 tasks | 5/5 ✅ |
| `frontend-designer` | UI/UX, responsive design | 6 tasks | 3/6 🔄 |
| `test-architect` | Testing, coverage | 5 tasks | 0/5 📋 |
| `doc-smith` | Documentation | 5 tasks | 0/5 📋 |
| `devops-automator` | CI/CD, deployment | 5 tasks | 0/5 📋 |

### Manual Agent Control

Run individual agents:
```bash
./scripts/run-agent.sh code-surgeon
./scripts/run-agent.sh frontend-designer
# etc.
```

### Progress Tracking

- **PLAN.md**: Master task breakdown and dependencies
- **PROGRESS.md**: Real-time status of all tasks
- **Git log**: Detailed history of agent commits

### System Status

Check current progress:
```bash
grep -c "🟢 DONE" PROGRESS.md  # Completed tasks
grep -c "🔴 TODO" PROGRESS.md  # Remaining tasks
grep -c "🟡 DOING" PROGRESS.md # In progress
```

## Getting Started (Manual Development)

### Prerequisites

- Node.js 18+
- Supabase account
- YouTube API key (optional, for future enrichment features)

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Direct PostgreSQL connection for migrations
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT-REF.supabase.co:5432/postgres

# Cron Authentication
CRON_SECRET=your-random-secret-here

# External APIs (optional)
YOUTUBE_API_KEY=
OPENROUTER_API_KEY=
GOOGLE_AI_API_KEY=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Apply the migration in Supabase SQL Editor:

```sql
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_alert_type_check;
ALTER TABLE alerts ADD CONSTRAINT alerts_alert_type_check
CHECK (alert_type IN (
  'keyword_match',
  'category_digest',
  'channel_upload',
  'high_score',
  'feed_error'
));
```

### Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## RSS Ingestion

### Manual Triggers

**Global Refresh** (all active profiles):
```bash
curl -X POST http://localhost:3000/api/rss/refresh
```

**Per-Profile Refresh**:
```bash
curl -X POST http://localhost:3000/api/rss/refresh/PROFILE_ID
```

Or use the UI buttons:
- Dashboard: "Refresh All" button
- Profile page: Refresh icon near Settings button

### Cron Processing

Process pending jobs:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/ingest-channels
```

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

## Deployment

### Environment Variables

Required in production:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `CRON_SECRET` - Random secret for authenticating cron requests

### Vercel Deployment

1. Deploy to Vercel via Git integration

2. Vercel Cron (requires Pro plan):
   - Configured in `vercel.json`
   - Runs automatically every 15 minutes
   - No additional setup needed

3. **Alternative: External Cron Service** (free tier compatible):
   - Use [cron-job.org](https://cron-job.org) or similar
   - URL: `https://yourdomain.com/api/cron/ingest-channels`
   - Schedule: `*/15 * * * *` (every 15 minutes)
   - Header: `Authorization: Bearer {CRON_SECRET}`

### Database Migration

Run this in Supabase SQL Editor after deployment:
```sql
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_alert_type_check;
ALTER TABLE alerts ADD CONSTRAINT alerts_alert_type_check
CHECK (alert_type IN (
  'keyword_match',
  'category_digest',
  'channel_upload',
  'high_score',
  'feed_error'
));
```

## Testing

See [docs/testing/rss-integration-test-guide.md](docs/testing/rss-integration-test-guide.md) for comprehensive testing instructions.

## Architecture

```
RSS Feed → Parser → Job Queue → Processor → Videos + Cards
```

- **RSS Parser**: Fetches YouTube channel feeds (no API quota)
- **Job Queue**: PostgreSQL-backed queue with retry logic
- **Processor**: Batch processing with timeout safety
- **Alerts**: Created after 3 failed attempts

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [RSS Feed Specification](https://www.rssboard.org/rss-specification)
