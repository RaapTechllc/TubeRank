# RSS Ingestion System Design

**Date**: 2026-01-08
**Status**: Approved
**Scope**: YouTube channel RSS feed ingestion with manual and automatic triggers

---

## Overview

Build an RSS ingestion system that automatically discovers new YouTube videos from subscribed channels and adds them to profile inboxes. The system supports both automatic hourly polling and manual user-triggered refreshes, processes jobs in batches to respect serverless limits, and handles errors gracefully with retries and alerts.

## Key Decisions

- **Channel RSS only (for now)**: Start with YouTube channel feeds, design for future expansion to search/category RSS
- **Store + cards, manual AI**: Videos appear in inbox immediately, but AI processing (transcripts/summaries/scoring) requires manual trigger
- **One job per channel**: Granular job queue entries for better observability and retry logic
- **Upsert strategy**: Keep video metadata fresh with ON CONFLICT updates
- **Hourly polling**: Balance between freshness and resource usage
- **Retry with alerts**: Automatic retry up to 3 attempts, create alert if all retries fail
- **Dual triggers**: Global "Refresh All" and per-profile refresh buttons
- **Batch processing**: Process 10-20 jobs per cron run to respect serverless timeouts

---

## Architecture

### Core Flow

Two trigger paths converge on the same job queue:

1. **Automatic Path**:
   - External cron service (Vercel Cron or cron-job.org) hits `/api/cron/process-jobs` every hour
   - Endpoint queries `job_queue` for pending `rss_fetch_channel` jobs
   - Processes them in batches (10-20 at a time)

2. **Manual Path**:
   - Users click "Refresh All" (dashboard) or per-profile refresh button
   - API routes enqueue jobs into `job_queue` for relevant channels
   - Return immediately (don't wait for processing)

### Job Queue Pattern

Leverage existing `job_queue` table. Each channel gets one job entry:

```typescript
{
  job_type: 'rss_fetch_channel',
  payload: {
    channel_youtube_id: 'UC123...',
    channel_name: 'Optional Name',
    triggered_by: 'manual' | 'cron'
  },
  status: 'pending' | 'running' | 'completed' | 'failed',
  attempts: 0,
  max_attempts: 3
}
```

### Data Flow

```
RSS Feed → Parse → Upsert Video → Find Matching Profiles → Create Cards → Update Channel → Log Success
```

Detailed steps:
1. Fetch RSS from `https://www.youtube.com/feeds/videos.xml?channel_id={id}`
2. Parse with YouTube-specific wrapper around rss-parser
3. Upsert each video to `videos` table (ON CONFLICT update metadata)
4. Query `profile_sources` for profiles with matching channel source
5. Create `profile_video_cards` in "inbox" column (check for existing first)
6. Update `channels.last_checked_at` timestamp
7. Log success to `job_runs` table

---

## Data Model

### Schema Changes

Minimal changes needed - existing schema is 90% ready:

1. **New Alert Type**: Add `'feed_error'` to `alerts.alert_type` check constraint for RSS failures

2. **Optional Enhancement**: Add `rss_url` column to `channels` table to cache computed URL (or compute on-the-fly since pattern is predictable)

### Deduplication Strategy

- **Videos**: `INSERT ... ON CONFLICT (youtube_id) DO UPDATE SET view_count=EXCLUDED.view_count, updated_at=now()`
- **Cards**: Check if `(profile_id, video_id)` pair exists using `idx_cards_video_profile` before inserting
- **Jobs**: Before enqueuing, check if pending/running job already exists for that channel

### Channel Discovery

When manual refresh is triggered:
- **Refresh All**: Query all distinct channels from `profile_sources` where `source_type = 'channel'` and profile is active
- **Per-Profile**: Filter by `profile_id` to get only that profile's channels

---

## RSS Parsing Implementation

### YouTube RSS Feed Format

Feed URL: `https://www.youtube.com/feeds/videos.xml?channel_id={youtube_id}`

Returns Atom XML with key fields:
- `yt:videoId` - 11-character YouTube video ID
- `yt:channelId` - Channel ID (redundant)
- `title` - Video title
- `published` - ISO 8601 timestamp
- `media:group.media:description` - Video description
- `media:group.media:thumbnail` - Thumbnail URL
- `link` - Full YouTube URL

### YouTube RSS Parser Utility

Create `lib/rss/youtube-parser.ts`:

```typescript
async function fetchYouTubeChannelFeed(channelId: string): Promise<ParsedVideo[]>
```

Responsibilities:
- Construct RSS URL from channel ID
- Fetch and parse feed using rss-parser
- Extract YouTube-specific fields (handle `yt:` namespace)
- Normalize dates to ISO format
- Return clean video objects matching Video schema
- Throw descriptive errors (RSSFetchError, RSSParseError)

### Missing Metadata

YouTube RSS doesn't include view counts, durations, or like counts. These fields will be `null` initially. Future enhancement: fetch via YouTube Data API.

For MVP, RSS provides enough for inbox display:
- Title
- Thumbnail
- Published date
- Description
- Channel name

---

## Job Processing Logic

### Job Processor Route: `/api/cron/process-jobs`

**Security**: Verify request from authorized cron source (check `Authorization` header against `CRON_SECRET`)

**Processing Flow**:

1. Fetch up to 20 pending jobs:
   ```sql
   SELECT * FROM job_queue
   WHERE job_type = 'rss_fetch_channel'
     AND status = 'pending'
   ORDER BY scheduled_at ASC
   LIMIT 20
   ```

2. For each job sequentially:
   ```
   - Mark status = 'running', set started_at
   - Try:
       * Parse channel_youtube_id from payload
       * Call fetchYouTubeChannelFeed(channelId)
       * For each video in feed:
           - Upsert to videos table
           - Find profiles with source_type='channel' and source_value=channelId
           - Create profile_video_cards in 'inbox' if not exists
       * Update channels.last_checked_at = now()
       * Mark job status = 'completed', set completed_at
       * Log success to job_runs
   - Catch error:
       * Increment attempts
       * If attempts < max_attempts: reset status = 'pending' (will retry)
       * If attempts >= max_attempts:
           - Mark status = 'failed'
           - Create alert with alert_type='feed_error'
       * Store error message in job.error field
   ```

3. Return summary: `{ processed: 15, succeeded: 14, failed: 1 }`

**Timeout Safety**:
- Track elapsed time during processing
- Stop processing new jobs if approaching function timeout (e.g., stop at 50s for 60s limit)
- Remaining jobs picked up by next cron run

**Idempotency**:
- Upsert semantics make this safe to run multiple times
- `status = 'running'` filter prevents double-processing if cron jobs overlap

---

## Manual Trigger API Routes

### Global Refresh: `POST /api/rss/refresh`

Triggered by "Refresh All" button in dashboard.

**Logic**:
1. Query distinct channels:
   ```sql
   SELECT DISTINCT ps.source_value
   FROM profile_sources ps
   JOIN profiles p ON ps.profile_id = p.id
   WHERE ps.source_type = 'channel'
     AND p.is_active = true
   ```

2. For each channel:
   - Check if pending/running job exists in job_queue
   - If not, insert job with `triggered_by: 'manual'`

3. Return `{ enqueued: 25, skipped: 3 }`

4. Optionally trigger immediate processing (async, don't wait)

### Per-Profile Refresh: `POST /api/rss/refresh/[profileId]`

Triggered by refresh button on profile's Kanban board.

**Logic**:
1. Validate profileId (UUID format)

2. Query channels for this profile:
   ```sql
   SELECT source_value
   FROM profile_sources
   WHERE profile_id = $1
     AND source_type = 'channel'
   ```

3. Same enqueue logic as global refresh

4. Return `{ enqueued: 5, skipped: 0 }`

**Response Time**: Both routes return immediately after enqueuing (sub-second). Don't wait for RSS fetching to complete.

**Rate Limiting**: Consider adding:
- Max 1 global refresh per minute
- Max 1 per-profile refresh per 30 seconds

---

## UI Integration & UX

### Dashboard UI

**Location**: `app/(main)/dashboard/page.tsx`

**Changes**:
- Add "Refresh All" button in header/toolbar
- Show loading spinner while request in flight
- On click: POST to `/api/rss/refresh`
- Show toast: "Checking 25 channels for new videos..."
- Users can navigate away (don't block)

### Profile Board UI

**Location**: Kanban board component

**Changes**:
- Add refresh icon button (`RefreshCw` from lucide-react) near profile name
- Same loading/toast pattern as global refresh
- On click: POST to `/api/rss/refresh/[profileId]`

### Optimistic Board Updates

Since jobs run async, new cards won't appear immediately. Options:

1. **Poll for new cards**: Every 10s while refresh active, refetch cards
2. **Manual refresh**: Auto-reload board on navigation back, or add "Reload Board" button
3. **Realtime subscriptions** (future): Supabase realtime pushes new cards

**MVP Approach**: Option 2 (manual refresh) - users trigger refresh, wait briefly, then refresh board view or navigate away and back.

### Visual Feedback

- Show `channels.last_checked_at` in profile settings: "Last synced: 2 hours ago"
- Show timestamp with refresh button: "Last synced: 2 hours ago"
- When alerts with `alert_type = 'feed_error'` exist, show notification badge: "Failed to fetch from 2 channels"

### Error States

Display inline errors or notification badge when feed errors occur. Link to alerts table for details.

---

## Testing Strategy

### Unit Tests

**File**: `lib/rss/youtube-parser.test.ts`

Tests:
- Mock RSS responses with sample YouTube feed XML
- Test successful parsing extracts correct fields (videoId, title, published, etc.)
- Test malformed XML throws `RSSParseError`
- Test network failures throw `RSSFetchError`
- Test empty feed returns empty array

### Integration Tests

**File**: `api/cron/process-jobs.test.ts`

Tests:
- Mock Supabase client
- Test job status transitions (pending → running → completed)
- Test retry logic (pending → running → failed → pending)
- Test max attempts creates alert
- Test batch processing stops at limit

### Manual Testing

1. Add real YouTube channels to profile sources
2. Trigger manual refresh, verify jobs enqueued
3. Run cron endpoint manually, verify videos appear in inbox
4. Test with deleted/invalid channel, verify alert created
5. Test duplicate prevention (trigger refresh twice quickly)

---

## Edge Cases

1. **Channel has no videos**: RSS returns empty - mark completed, no cards created

2. **Channel deleted/private**: RSS returns 404 - fail job, create alert after retries

3. **Duplicate video in multiple profiles**: Same video appears in inbox for multiple profiles (expected behavior)

4. **User deletes profile while job pending**: CASCADE delete removes profile_sources, job runs but finds no profiles (harmless)

5. **RSS feed has >15 videos**: YouTube RSS typically returns last 15 - process all, older videos might exist (upsert handles it)

6. **Clock skew in published dates**: Some feeds have future dates - store as-is, let UI handle sorting

7. **Very long titles/descriptions**: TEXT columns handle arbitrary length

8. **Network timeout**: Parser throws error, job retries

9. **Concurrent cron runs**: `status = 'running'` filter prevents double-processing

10. **Serverless timeout**: Process in batches, remaining jobs picked up next run

---

## Deployment

### Environment Variables

Add to `.env.local` and production:

```
CRON_SECRET=random-secret-string-for-authenticating-cron-requests
```

### Vercel Cron Setup

**Option 1 - Vercel Cron** (if on paid plan):

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-jobs",
    "schedule": "0 * * * *"
  }]
}
```

**Option 2 - External Cron**:

Use cron-job.org or similar:
- URL: `https://yourdomain.com/api/cron/process-jobs`
- Schedule: Every hour (`0 * * * *`)
- Headers: `Authorization: Bearer {CRON_SECRET}`

### Database Migration

Add `feed_error` to alerts enum (if using check constraint):

```sql
ALTER TABLE alerts
DROP CONSTRAINT IF EXISTS alerts_alert_type_check;

ALTER TABLE alerts
ADD CONSTRAINT alerts_alert_type_check
CHECK (alert_type IN (
  'keyword_match',
  'category_digest',
  'channel_upload',
  'high_score',
  'feed_error'
));
```

### Initial Data

Ensure `channels` table has entries for channel_youtube_ids referenced in `profile_sources`, or handle missing channels gracefully in the code.

### Monitoring

- Check `job_runs` table periodically for high failure rates
- Monitor `job_queue` for stuck jobs (status='running' for >1 hour)
- Set up alerts if error rate exceeds threshold

---

## Performance Considerations

**Load Estimates**:
- 100 channels × 15 videos = 1,500 upserts per run
- Sequential processing: ~2s per channel = 200s total
- Batch of 20 channels: ~40s (within 60s timeout)

**Optimizations** (future):
- Batch inserts for videos (array of values)
- Parallel processing with concurrency limit (Promise.all)
- Skip unchanged videos using etag/last-modified headers

**Database Performance**:
- Index on `videos(youtube_id)` makes upsert fast
- Index on `profile_sources(source_type, source_value)` for channel lookups
- Index on `job_queue(job_type, status, scheduled_at)` for job queries

---

## Future Enhancements

**Out of scope for MVP, but designed to support**:

1. **YouTube Data API enrichment**: After RSS fetch, optionally call YouTube API for view counts, durations, like counts (costs quota)

2. **Keyword RSS support**: Extend to YouTube search RSS (`https://www.youtube.com/feeds/videos.xml?search_query=...`) for keyword_radar profiles

3. **Category feeds**: Support YouTube category browsing RSS for category_pulse profiles

4. **Smart polling intervals**: Adjust per-channel frequency based on upload patterns (active channels hourly, dormant daily)

5. **Incremental fetching**: Use `channels.last_checked_at` and RSS `<updated>` tags to skip if no new content

6. **Realtime updates**: Supabase subscriptions push new cards to UI without polling

7. **Batch card creation**: Supabase bulk insert for better performance

8. **Job queue dashboard**: Admin UI showing pending/failed jobs with manual retry

9. **RSS caching**: Cache RSS responses for short periods to reduce redundant fetches

10. **Webhooks**: YouTube PubSubHubbub for instant notifications (complex setup)

---

## Success Metrics

- **Latency**: Time from video published → appears in inbox (target: < 1 hour)
- **Reliability**: Job success rate (target: > 95%)
- **Performance**: Average processing time per channel (target: < 2s)
- **Coverage**: Percentage of followed channels successfully fetched (target: > 98%)

---

## Summary

This RSS ingestion system:

✅ Fetches YouTube channel feeds via RSS (free, no API quota)
✅ Processes jobs in batches respecting serverless timeouts
✅ Supports both manual and automatic triggers
✅ Handles errors gracefully with retries and alerts
✅ Creates cards in inbox for immediate visibility
✅ Leaves AI processing for manual trigger (cost control)
✅ Designed for future expansion to search/category RSS

The implementation is straightforward, leverages existing infrastructure (job_queue, Supabase), and provides a solid foundation for the full video triage workflow.
