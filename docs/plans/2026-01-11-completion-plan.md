# TubeRank Completion Plan

**Date**: 2026-01-11  
**Goal**: Get project to 100% production-ready state  
**Status**: COMPLETED

---

## Summary of Work Done

### TypeScript Fixes Applied
- [x] Fixed `lib/rate-limit/limiter.ts` - removed duplicate code block
- [x] Fixed `lib/utils/auth.ts` - implemented `verifyBearerToken` function
- [x] Fixed `lib/jobs/queue.ts` - added missing imports, types, and `markJobRunning`/`markJobFailed`
- [x] Fixed `lib/jobs/queue-rpc.ts` - implemented `getNextJob` function
- [x] Fixed `app/api/analytics/performance/route.ts` - fixed syntax error and missing import
- [x] Fixed multiple analytics routes - added null safety checks
- [x] Fixed `lib/rss/process-channel-job.ts` - exported `ProcessResult` type
- [x] Fixed `lib/services/card-service.ts` - proper type annotation

### Cron Features Implemented
- [x] `app/api/cron/ingest-keywords/route.ts` - YouTube keyword search with quota tracking
- [x] `app/api/cron/ingest-category/route.ts` - YouTube trending videos by category
- [x] `app/api/cron/daily-digest/route.ts` - Daily high-score video digest with alerts

### UI Enhancements Added
- [x] Toast notifications (using sonner) in dashboard and profile pages
- [x] `last_checked_at` display in profile header
- [x] New API endpoint `/api/profiles/[id]/channels` for channel data

### Package Dependencies Updated
- Added `recharts` for analytics charts
- Added `sonner` for toast notifications
- Added `vitest` and `@testing-library/react` for tests
- Excluded `tests/` from TypeScript compilation

---

---

## Current State Summary

### What's Working
- **Profile CRUD**: Full create/read/update/delete with sources management
- **Kanban Board**: Drag-and-drop cards across 5 columns (inbox, recommended, skim, watch, archived)
- **RSS Ingestion**: YouTube channel feeds via `/api/cron/ingest-channels` with retry logic and alerts
- **Manual Refresh**: Global (`/api/rss/refresh`) and per-profile (`/api/rss/refresh/[profileId]`) endpoints
- **Rate Limiting**: In-memory sliding window on refresh endpoints
- **Analytics**: 6 pages with charts (performance, scores, channels, velocity, workflow, overview)
- **Job Queue**: PostgreSQL-backed with batch processing and timeout safety
- **Database**: Full schema with 13 tables, indexes, and migrations

### What's Incomplete (TODOs from codebase)

| Area | File | TODO |
|------|------|------|
| **Cron: Keywords** | `app/api/cron/ingest-keywords/route.ts` | `// TODO: Implement keyword ingestion` |
| **Cron: Category** | `app/api/cron/ingest-category/route.ts` | `// TODO: Implement category ingestion` |
| **Cron: Digest** | `app/api/cron/daily-digest/route.ts` | `// TODO: Implement daily digest` |
| **UI: Toast** | `app/(main)/dashboard/page.tsx` | `// TODO: Show toast notification` |
| **UI: Toast** | `app/(main)/profile/[id]/page.tsx` | No toast on refresh (console.log only) |

### From DEVLOG Follow-ups
- [ ] Apply database migration in Supabase SQL Editor (feed_error alert type)
- [ ] Add toast notifications for refresh actions
- [ ] Show `last_checked_at` timestamps in UI
- [ ] Set up Vercel Cron or external cron service for production
- [ ] Consider YouTube Data API enrichment for view counts/stats

### From Analytics Follow-ups
- [ ] Add date-fns tree-shaking to reduce bundle size
- [ ] Implement server-side caching for analytics endpoints
- [ ] Add export functionality (CSV/PNG) for charts
- [ ] Create `/analytics/compare` page for profile comparison
- [ ] Add `/analytics/[profileId]` for profile-specific deep dive
- [ ] Consider virtualization for large channel tables
- [ ] Add accessibility testing for charts

---

## Priority Tiers

### P0: Core Functionality (Must Have)
1. **Keyword Ingestion Cron** - Makes `keyword_radar` profile type functional
2. **Category Ingestion Cron** - Makes `category_pulse` profile type functional
3. **Daily Digest Cron** - Core feature for daily summaries
4. **Toast Notifications** - Replace console.log with user-visible feedback

### P1: Production Readiness
5. **Migration Documentation** - Clear steps to apply all SQL migrations
6. **Environment Validation** - Runtime checks for required env vars
7. **Error Boundary** - Graceful error handling for UI crashes

### P2: Polish & UX
8. **Show `last_checked_at`** - Display when channels were last refreshed
9. **Loading States** - Consistent skeleton loaders across app
10. **Empty States** - Better messaging when no data exists

### P3: Future Enhancements (Not blocking 100%)
- Analytics caching, export, compare pages
- YouTube Data API enrichment
- Bundle size optimization
- Accessibility improvements

---

## Task Specifications

### Task 1: Keyword Ingestion Cron

**Purpose**: Search YouTube for videos matching profile keywords and ingest them.

**Data Flow**:
```
profile_sources (type='keyword') → YouTube Search API → videos → profile_video_cards
```

**Implementation**:

```typescript
// app/api/cron/ingest-keywords/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getEnv } from '@/lib/config/env'
import { verifyBearerToken } from '@/lib/utils/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const env = getEnv()
  const authHeader = request.headers.get('authorization')
  
  if (!verifyBearerToken(authHeader, env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  let processed = 0
  let succeeded = 0
  let failed = 0

  try {
    // 1. Get all keyword sources from active profiles
    const { data: sources } = await supabase
      .from('profile_sources')
      .select('id, profile_id, source_value, metadata, profiles!inner(is_active)')
      .eq('source_type', 'keyword')

    if (!sources?.length) {
      return NextResponse.json({ success: true, processed: 0, message: 'No keyword sources' })
    }

    // Filter to active profiles
    const activeKeywords = sources.filter(s => 
      (s.profiles as any)?.is_active === true
    )

    // 2. For each keyword, search YouTube (requires YOUTUBE_API_KEY)
    const youtubeApiKey = env.YOUTUBE_API_KEY
    if (!youtubeApiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'YOUTUBE_API_KEY not configured' 
      }, { status: 500 })
    }

    for (const source of activeKeywords) {
      processed++
      try {
        // Search YouTube
        const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
        searchUrl.searchParams.set('part', 'snippet')
        searchUrl.searchParams.set('q', source.source_value)
        searchUrl.searchParams.set('type', 'video')
        searchUrl.searchParams.set('order', 'date')
        searchUrl.searchParams.set('maxResults', '10')
        searchUrl.searchParams.set('publishedAfter', getLastDayISO())
        searchUrl.searchParams.set('key', youtubeApiKey)

        const response = await fetch(searchUrl.toString())
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || 'YouTube API error')
        }

        // 3. Upsert videos
        for (const item of data.items || []) {
          const videoData = {
            youtube_id: item.id.videoId,
            channel_id: item.snippet.channelId,
            channel_name: item.snippet.channelTitle,
            title: item.snippet.title,
            description: item.snippet.description,
            published_at: item.snippet.publishedAt,
            thumbnail_url: item.snippet.thumbnails?.high?.url
          }

          const { data: video } = await supabase
            .from('videos')
            .upsert(videoData, { onConflict: 'youtube_id' })
            .select('id')
            .single()

          if (video) {
            // Create card if not exists
            await supabase
              .from('profile_video_cards')
              .upsert({
                profile_id: source.profile_id,
                video_id: video.id,
                column_status: 'inbox'
              }, { onConflict: 'profile_id,video_id', ignoreDuplicates: true })

            // Create keyword_match alert
            await supabase
              .from('alerts')
              .insert({
                profile_id: source.profile_id,
                video_id: video.id,
                alert_type: 'keyword_match',
                title: `Keyword match: "${source.source_value}"`,
                message: videoData.title,
                is_read: false
              })
          }
        }

        succeeded++
      } catch (error) {
        console.error(`Keyword search failed for "${source.source_value}":`, error)
        failed++
      }
    }

    return NextResponse.json({ success: true, processed, succeeded, failed })
  } catch (error) {
    console.error('Keyword ingestion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

function getLastDayISO(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString()
}
```

**Quota Consideration**: YouTube Data API has 10,000 units/day. Search costs 100 units. 
With 10 keywords checked every 30 min = ~28,800 units/day = exceeds quota!

**Recommended Approach**:
- Use job queue like channels (one job per keyword)
- Limit to 50 keywords total
- Track quota in `quota_usage` table
- Fall back to RSS search if quota exceeded

---

### Task 2: Category Ingestion Cron

**Purpose**: Fetch trending/popular videos in YouTube categories.

**Categories** (YouTube API): `1=Film`, `10=Music`, `22=People/Blogs`, `24=Entertainment`, `25=News`, `26=HowTo`, `27=Education`, `28=Science`

**Implementation**:

```typescript
// app/api/cron/ingest-category/route.ts
export async function GET(request: Request) {
  // Similar pattern to keywords
  // 1. Get profile_sources where source_type='category'
  // 2. For each category, call YouTube Videos API with chart=mostPopular
  // 3. Upsert videos and create cards
  // 4. Create category_digest alerts
}
```

**API Call**:
```
GET https://www.googleapis.com/youtube/v3/videos
  ?part=snippet,statistics
  &chart=mostPopular
  &regionCode=US
  &videoCategoryId={categoryId}
  &maxResults=10
  &key={API_KEY}
```

Cost: 1 unit per request (much cheaper than search!)

---

### Task 3: Daily Digest Cron

**Purpose**: Generate daily summary of new high-scoring videos.

**Implementation**:

```typescript
// app/api/cron/daily-digest/route.ts
export async function GET(request: Request) {
  // 1. Check user_settings.digest_enabled
  // 2. Get videos from last 24h with scores > threshold
  // 3. Group by profile
  // 4. Create category_digest alerts with summary
  // 5. Optionally send email/notification (future)
}
```

**Query**:
```sql
SELECT 
  p.id as profile_id,
  p.name as profile_name,
  v.title,
  s.overall_score
FROM profile_video_cards pvc
JOIN videos v ON pvc.video_id = v.id
JOIN scores s ON s.video_id = v.id AND s.profile_id = pvc.profile_id
JOIN profiles p ON pvc.profile_id = p.id
WHERE pvc.created_at > NOW() - INTERVAL '24 hours'
  AND s.overall_score >= (SELECT default_score_threshold FROM user_settings LIMIT 1)
ORDER BY p.id, s.overall_score DESC
```

---

### Task 4: Toast Notifications

**Approach**: Use Sonner (lightweight, ~3KB) - https://sonner.emilkowal.ski/

**Files to modify**:
1. `package.json` - Add `sonner` dependency
2. `app/layout.tsx` - Add `<Toaster />` provider
3. `app/(main)/dashboard/page.tsx` - Replace console.log with toast()
4. `app/(main)/profile/[id]/page.tsx` - Replace console.log with toast()

**Implementation**:

```bash
npm install sonner
```

```tsx
// app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  )
}
```

```tsx
// In dashboard/page.tsx
import { toast } from 'sonner'

const handleRefreshAll = async () => {
  setIsRefreshing(true)
  try {
    const response = await fetch('/api/rss/refresh', { method: 'POST' })
    const data = await response.json()

    if (response.ok) {
      toast.success(`Checking ${data.enqueued} channels for new videos`)
    } else if (response.status === 429) {
      toast.error('Too many requests. Please wait a few minutes.')
    } else {
      toast.error(data.error || 'Refresh failed')
    }
  } catch (error) {
    toast.error('Network error. Please try again.')
  } finally {
    setIsRefreshing(false)
  }
}
```

---

### Task 5: Show `last_checked_at` in UI

**Location**: Profile page header or channel list.

**Implementation**:

```tsx
// components/profiles/profile-header.tsx
import { formatDistanceToNow } from 'date-fns'

export function ProfileHeader({ profile, channels }) {
  const lastChecked = channels
    .map(c => c.last_checked_at)
    .filter(Boolean)
    .sort()
    .pop()

  return (
    <div>
      <h1>{profile.name}</h1>
      {lastChecked && (
        <span className="text-sm text-muted-foreground">
          Last checked {formatDistanceToNow(new Date(lastChecked), { addSuffix: true })}
        </span>
      )}
    </div>
  )
}
```

**API**: Need to expose channel data with `last_checked_at` through profile endpoint.

---

## Implementation Order

```
Week 1: Core Functionality
├── Day 1-2: Toast notifications (simple, high impact)
├── Day 3-4: Keyword ingestion with quota tracking
├── Day 5: Category ingestion
└── Day 6-7: Daily digest

Week 2: Polish & Production
├── Day 1: Show last_checked_at in UI
├── Day 2: Migration documentation + env validation
├── Day 3: Error boundaries
├── Day 4: Testing all cron endpoints
└── Day 5: Deployment checklist verification
```

---

## Migration Checklist

### SQL Migrations to Apply (in order):
1. `00001_initial_schema.sql` - Base tables
2. `00002_add_feed_error_alert_type.sql` - Adds 'feed_error' to alerts
3. `20250110_get_next_job.sql` - RPC for atomic job claiming
4. `20250110_updated_at_triggers.sql` - Auto-update timestamps
5. `20250110_analytics_optimization.sql` - Indexes for analytics queries

### Environment Variables Required:
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=

# For keyword/category ingestion
YOUTUBE_API_KEY=

# Optional
OPENROUTER_API_KEY=    # For AI summaries
GOOGLE_AI_API_KEY=     # Alternative AI provider
NEXT_PUBLIC_APP_URL=   # For absolute URLs
```

---

## Verification Checklist

### Functionality
- [ ] Create profile with channel source → cards appear after refresh
- [ ] Create profile with keyword source → cards appear after cron
- [ ] Create profile with category source → cards appear after cron
- [ ] Daily digest creates alerts at 8 AM
- [ ] Drag card between columns → persists on reload
- [ ] Delete profile → cascades to cards
- [ ] Invalid channel → alert created after 3 retries

### UI/UX
- [ ] Refresh button shows spinner while loading
- [ ] Toast appears on refresh success/failure
- [ ] Rate limit shows appropriate error toast
- [ ] Last checked time displays correctly
- [ ] Analytics charts load with skeleton states
- [ ] Empty states shown when no data

### Production
- [ ] All migrations applied
- [ ] Vercel crons configured
- [ ] Environment variables set
- [ ] CRON_SECRET is random and secure
- [ ] Rate limiting active
- [ ] Error boundaries catch crashes

---

## Files to Create/Modify

### New Files:
- `lib/youtube/search.ts` - YouTube Data API wrapper
- `lib/youtube/categories.ts` - Category lookup
- `components/ui/toaster.tsx` - Sonner wrapper (if customizing)

### Modified Files:
- `package.json` - Add sonner
- `app/layout.tsx` - Add Toaster provider
- `app/(main)/dashboard/page.tsx` - Toast + last_checked
- `app/(main)/profile/[id]/page.tsx` - Toast
- `app/api/cron/ingest-keywords/route.ts` - Full implementation
- `app/api/cron/ingest-category/route.ts` - Full implementation
- `app/api/cron/daily-digest/route.ts` - Full implementation
- `lib/jobs/queue.ts` - Add keyword/category job types
- `lib/config/env.ts` - Add YOUTUBE_API_KEY validation

---

## Critical TypeScript Fixes Required

The codebase has several TypeScript errors that must be fixed first:

### Issue 1: Duplicate Code in limiter.ts
**File**: `lib/rate-limit/limiter.ts`
**Problem**: Lines 87-142 are duplicated code that escaped the class block
**Fix**: Delete lines 87-143 (everything after line 86)

### Issue 2: Missing Function in auth.ts
**File**: `lib/utils/auth.ts`  
**Problem**: `verifyBearerToken` function declared but not implemented
**Fix**: Add implementation:
```typescript
export function verifyBearerToken(authHeader: string | null, expectedToken: string): boolean {
  if (!authHeader) return false
  const token = authHeader.replace('Bearer ', '')
  return timingSafeEqual(token, expectedToken)
}
```

### Issue 3: Missing Imports/Types in queue.ts
**File**: `lib/jobs/queue.ts`
**Problem**: Missing imports for `createServerClient`, `RefreshChannelsOptions`, `EnqueueResult`, `JobType`
**Fix**: Add imports and type definitions at top of file

### Issue 4: Missing Functions in queue.ts
**File**: `lib/jobs/queue.ts`
**Problem**: `markJobRunning` and `markJobFailed` not exported
**Fix**: Add implementations

### Issue 5: Syntax Error in performance route
**File**: `app/api/analytics/performance/route.ts`
**Problem**: Line 95 has syntax error
**Fix**: Check and fix the expression

### Issue 6: Incomplete queue-rpc.ts
**File**: `lib/jobs/queue-rpc.ts`
**Problem**: File ends at line 9 without `getNextJob` implementation
**Fix**: Complete the RPC function

---

## Success Criteria

**100% Complete** means:
1. TypeScript compiles with zero errors (`npm run typecheck` passes)
2. All 4 profile types work (channel_stack, keyword_radar, category_pulse, video_set)
3. All 4 cron jobs functional (channels, keywords, categories, digest)
4. User feedback via toasts (not console.log)
5. All migrations documented and applied
6. Vercel deployment works end-to-end
7. No TODO comments in production code paths
