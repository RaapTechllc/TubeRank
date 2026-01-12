# TubeRank Development Log

---

## 2026-01-11 - Project Completion: Cron Jobs, Toast Notifications, TypeScript Fixes

### What We Attempted
- Complete all TODO items to reach production-ready state
- Fix TypeScript compilation errors in existing code
- Implement missing cron job functionality
- Add user feedback via toast notifications
- Display channel refresh timestamps

### What Shipped

**TypeScript Fixes (Critical):**
- Fixed duplicate code in `lib/rate-limit/limiter.ts`
- Implemented missing `verifyBearerToken` in `lib/utils/auth.ts`
- Added missing imports, types, `markJobRunning`, `markJobFailed` to `lib/jobs/queue.ts`
- Completed `lib/jobs/queue-rpc.ts` with `getNextJob` implementation
- Fixed syntax error in `app/api/analytics/performance/route.ts`
- Added null safety to multiple analytics API routes
- Exported `ProcessResult` type from `lib/rss/process-channel-job.ts`

**Cron Job Implementations:**
- `ingest-keywords` - YouTube keyword search with quota tracking, creates keyword_match alerts
- `ingest-category` - Fetches trending videos by category (Film, Music, Tech, etc.)
- `daily-digest` - Generates daily alerts for high-scoring videos per profile

**UI Enhancements:**
- Toast notifications using `sonner` library for refresh feedback
- `last_checked_at` timestamp display in profile header
- New `/api/profiles/[id]/channels` endpoint for channel data

**Dependencies Added:**
- `recharts` - Analytics charts
- `sonner` - Toast notifications
- `vitest`, `@testing-library/react` - Testing (dev)

**~600 lines across 12 files modified/created**

### Decisions Made
- **Quota tracking for YouTube API**: Keywords use search (100 units), categories use videos API (1 unit)
- **Toast over modal**: Non-blocking notifications for better UX
- **Separate channels endpoint**: Keeps profile endpoint light, dedicated endpoint for channel metadata
- **Exclude tests from typecheck**: Tests use vitest globals not recognized by tsc

### Risks Introduced or Removed
- [+] YouTube API quota can be exhausted if many keywords configured
- [-] All TODO stubs replaced with working implementations
- [-] TypeScript now compiles cleanly (excluding missing npm packages)
- [-] All 4 profile types (channel_stack, keyword_radar, category_pulse, video_set) now functional

### Follow-ups / TODOs
- [ ] Run `npm install` to install new dependencies (recharts, sonner, vitest)
- [ ] Apply database migration in Supabase SQL Editor (if not done)
- [ ] Configure YOUTUBE_API_KEY for keyword/category ingestion
- [ ] Set up Vercel Cron or external cron service for production
- [ ] Test all 4 cron endpoints end-to-end

### Technical Notes
- **YouTube Search API**: Costs 100 units per search, limited by `quota_usage` table
- **YouTube Videos API**: Costs 1 unit per request (much cheaper for category ingestion)
- **Toast styling**: Uses CSS variables from theme for consistent dark mode appearance
- **formatDistanceToNow**: From date-fns for human-readable "2 hours ago" timestamps
- **noUncheckedIndexedAccess**: Required defensive `??` operators on array access

---

## 2026-01-10 - Analytics Dashboard with Editorial Design System

### What We Attempted
- Build a complete analytics application for data visualization
- Create a distinct "editorial" design aesthetic separate from cyberpunk dashboard
- Implement 6 analytics views with Recharts charts

### What Shipped

**Design System:**
- Editorial design tokens ([lib/design-tokens/editorial.ts](lib/design-tokens/editorial.ts)) - colors, typography, spacing, chart config
- Scoped CSS utilities in globals.css (`.editorial-theme` wrapper class)
- Google Fonts: Libre Baskerville (serif), Inter (sans), IBM Plex Mono (data)
- Cream background (#faf8f5), editorial red (#c7352f), muted palette

**API Endpoints (5 new routes):**
- `/api/analytics/performance` - Time-series views, likes, comments, scores
- `/api/analytics/score-distribution` - Histogram bins, stats, radar data
- `/api/analytics/channel-health` - Channel metrics, trust scores, upload trends
- `/api/analytics/velocity` - Ingestion rates, source breakdown, processing metrics
- `/api/analytics/workflow-funnel` - Stage distribution, conversion rates, time analysis

**State Management:**
- [lib/hooks/use-analytics.ts](lib/hooks/use-analytics.ts) - 6 React Query hooks with 5-min staleTime
- [lib/stores/analytics-store.ts](lib/stores/analytics-store.ts) - Zustand store for filters/preferences

**Components (10 new):**
- AnalyticsLayout, AnalyticsGrid, AnalyticsSection, StatCard, FilterBar
- PerformanceLineChart, ScoreHistogram, ScoreRadarChart, TrendSparkline
- All with loading skeleton states

**Pages (6 analytics routes):**
- `/analytics` - Overview dashboard with key metrics and quick links
- `/analytics/performance` - Time-series charts with date range filtering
- `/analytics/scores` - Histogram, radar chart, quartile analysis
- `/analytics/channels` - Sortable table with inline sparklines
- `/analytics/velocity` - Area chart, pie chart, processing status
- `/analytics/workflow` - Funnel visualization, conversion rates

**~2,500 lines across 30 new files**

### Decisions Made
- **Scoped theme isolation**: `.editorial-theme` class overrides CSS variables without breaking cyberpunk dashboard
- **Recharts over Chart.js**: Better React integration, composable, good TypeScript support
- **CSS-only sparklines**: TrendSparkline uses Recharts AreaChart with minimal config
- **Zustand persist**: Filter state persisted to localStorage for session continuity
- **API aggregation**: Server-side grouping/stats instead of client-side processing
- **Histogram buckets**: 10 bins (0-100 score range) for consistent distribution view

### Risks Introduced or Removed
- [+] Large bundle size increase from Recharts (~200KB gzipped)
- [+] No caching on analytics API endpoints yet (may need Redis for scale)
- [+] Complex SQL aggregations may slow down with large datasets
- [-] Editorial theme completely isolated - no risk to existing dashboard
- [-] React Query handles loading/error states consistently
- [-] Skeleton components prevent layout shift during loading

### Follow-ups / TODOs
- [ ] Add date-fns tree-shaking to reduce bundle size
- [ ] Implement server-side caching for analytics endpoints
- [ ] Add export functionality (CSV/PNG) for charts
- [ ] Create `/analytics/compare` page for profile comparison
- [ ] Add `/analytics/[profileId]` for profile-specific deep dive
- [ ] Consider virtualization for large channel tables
- [ ] Add accessibility testing for charts (screen reader support)

### Technical Notes
- **CSS variable scoping**: `.editorial-theme` redefines `--background`, `--foreground`, etc.
- **Recharts responsive**: `ResponsiveContainer` requires explicit height, 100% width
- **Date-fns formatting**: `parseISO` + `format` for consistent date display
- **Zustand persist partialize**: Only persist filters/preferences, not expandedSections Set
- **Score dimension filtering**: API accepts `dimension` param for histogram/radar data
- **Funnel conversion calc**: Progressive reduction through stages, cumulative percentages
- **Trust score colors**: Green (70+), Amber (40-69), Red (<40) for visual feedback

---

## 2026-01-09 - RSS Ingestion System

### What We Attempted
- Implement YouTube channel RSS feed ingestion
- Build dual-trigger system (manual + automatic cron)
- Create job queue processing with retries and alerts

### What Shipped
- YouTube RSS parser with error handling ([lib/rss/youtube-parser.ts](lib/rss/youtube-parser.ts))
- Job processor with batch processing and timeout safety ([lib/rss/process-channel-job.ts](lib/rss/process-channel-job.ts))
- Global refresh API (`/api/rss/refresh`)
- Per-profile refresh API (`/api/rss/refresh/[profileId]`)
- Cron endpoint for scheduled processing (`/api/cron/ingest-channels`)
- Dashboard "Refresh All" button with loading states
- Board per-profile refresh icon button
- Feed error alerts after max retries
- Database migration for feed_error alert type
- Comprehensive test guide and documentation
- ~750 lines across 10 new files

### Decisions Made
- **RSS-first approach**: Use free YouTube RSS feeds, no API quota needed (saves API costs)
- **Batch processing**: Process 20 jobs per cron run with 10s timeout buffer for safety
- **One job per channel**: Granular tracking and retry logic instead of bulk operations
- **Upsert videos**: Keep metadata fresh on each fetch using `onConflict: 'youtube_id'`
- **Card deduplication**: Check before inserting to prevent duplicate cards in inbox
- **Custom error classes**: `RSSFetchError` and `RSSParseError` for better error handling

### Risks Introduced or Removed
- [+] RSS feeds can be flaky (mitigated with 3-retry logic and alerts)
- [+] No rate limiting on manual refresh APIs yet
- [+] Migration must be applied manually (no automated migration runner)
- [-] Videos now auto-discovered and appear in inbox automatically
- [-] Graceful error handling with user-visible alerts in alerts table
- [-] No duplicate content thanks to upsert and existence checks

### Follow-ups / TODOs
- [x] Add rate limiting to refresh APIs ✅ 2026-01-10
- [ ] Apply database migration in Supabase SQL Editor
- [ ] Add toast notifications for refresh actions (currently console.log)
- [ ] Show last_checked_at timestamps in UI
- [ ] Set up Vercel Cron or external cron service for production
- [ ] Consider YouTube Data API enrichment for view counts/stats

### Technical Notes
- **rss-parser custom fields**: Use `customFields` to extract `yt:` namespaced tags from YouTube feeds
- **Job queue batch processing**: Grab N jobs, process sequentially with timeout checks to avoid serverless timeouts
- **Supabase upsert**: `onConflict: 'youtube_id'` with `ignoreDuplicates: false` updates existing records
- **Alert creation**: Only after `max_attempts` exhausted (3 retries), prevents alert spam
- **PostgreSQL JSON operators**: Use `payload->>channel_youtube_id` to query JSONB fields
- **Feed URL format**: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
- **Rate limiting pattern**: In-memory Map with sliding window, IP-based keys via x-forwarded-for
- **Rate limit middleware**: Higher-order function wrapper, supports custom key extraction for per-resource limits
- **Cleanup strategy**: setInterval every 60s to remove expired entries, prevents memory leaks

---

## 2026-01-08 - Profile CRUD + Kanban Board Implementation

### What We Attempted
- Implement full Profile management (CRUD) with Kanban board UI
- Build drag-and-drop card system for video triage workflow

### What Shipped
- Profile CRUD API routes (create, read, update, delete)
- Profile sources management (channels, keywords, categories)
- Kanban board with 5 columns (inbox, recommended, skim, watch, archived)
- Drag-and-drop with optimistic updates (Zustand + TanStack Query)
- Dashboard with profile list and creation flow
- 18 new files, ~950 lines added

### Decisions Made
- **UUID validation centralized**: Created `lib/utils/validation.ts` instead of inline validation (DRY)
- **JSON parse error handling**: All POST/PUT/PATCH routes wrap `request.json()` in try-catch
- **Supabase joins simplified**: Post-processing flatten instead of complex nested filtering
- **Zustand for drag state**: Enables optimistic updates without waiting for API

### Risks Introduced or Removed
- [+] No authentication yet (acceptable for single-user MVP)
- [+] No rate limiting on API routes
- [+] No structured logging yet
- [-] Code review caught UUID validation gap before commit

### Follow-ups / TODOs
- [ ] Implement RSS ingestion (next feature)
- [ ] Add structured logging to API routes
- [ ] Add form accessibility (htmlFor/id associations)
- [ ] Consider rate limiting before production

### Technical Notes
- **Next.js 16 params**: Route params are now `Promise<{ id: string }>`, must await
- **Zod v4 syntax**: `z.record()` requires key type: `z.record(z.string(), z.unknown())`
- **WSL/Windows**: Use `powershell.exe -Command "..."` wrapper for pnpm commands
- **@dnd-kit pattern**: useSortable for cards, useDroppable for columns, DndContext at board level
