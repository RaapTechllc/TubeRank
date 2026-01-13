# RSS Ingestion System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build YouTube channel RSS ingestion system with manual/automatic triggers that discovers new videos and adds them to profile inboxes.

**Architecture:** RSS parser wraps rss-parser for YouTube feeds → Job queue processes channels in batches → Upserts videos to DB → Creates profile cards in inbox → Manual trigger APIs enqueue jobs, cron endpoint processes them.

**Tech Stack:** Next.js 16, rss-parser, Supabase (PostgreSQL), TypeScript, Zod

---

## Task 1: Database Migration - Add feed_error Alert Type

**Files:**
- Create: `supabase/migrations/00002_add_feed_error_alert_type.sql`

**Step 1: Write migration to add feed_error alert type**

```sql
-- Add feed_error to alerts alert_type check constraint
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

**Step 2: Apply migration locally**

Run: `psql $DATABASE_URL -f supabase/migrations/00002_add_feed_error_alert_type.sql`

Expected: `ALTER TABLE` success message

**Step 3: Verify migration**

Run: `psql $DATABASE_URL -c "\d alerts"`

Expected: See `feed_error` in check constraint

**Step 4: Commit**

```bash
git add supabase/migrations/00002_add_feed_error_alert_type.sql
git commit -m "feat: add feed_error alert type for RSS failures"
```

---

## Task 2: YouTube RSS Parser - Error Classes

**Files:**
- Create: `lib/rss/errors.ts`

**Step 1: Create custom error classes**

```typescript
export class RSSFetchError extends Error {
  constructor(
    message: string,
    public channelId: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'RSSFetchError'
  }
}

export class RSSParseError extends Error {
  constructor(
    message: string,
    public channelId: string
  ) {
    super(message)
    this.name = 'RSSParseError'
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 3: Commit**

```bash
git add lib/rss/errors.ts
git commit -m "feat: add RSS error classes"
```

---

## Task 3: YouTube RSS Parser - Core Implementation

**Files:**
- Create: `lib/rss/youtube-parser.ts`

**Step 1: Create parser interface and types**

```typescript
import Parser from 'rss-parser'
import { RSSFetchError, RSSParseError } from './errors'

export interface ParsedVideo {
  youtube_id: string
  channel_id: string
  channel_name: string
  title: string
  description: string
  published_at: string
  thumbnail_url: string
}

interface YouTubeFeedItem {
  id?: string
  title?: string
  contentSnippet?: string
  pubDate?: string
  link?: string
  'yt:videoId'?: string
  'yt:channelId'?: string
  'media:group'?: {
    'media:description'?: string
    'media:thumbnail'?: Array<{ $: { url: string } }>
  }
  author?: string
}

interface YouTubeFeed {
  items: YouTubeFeedItem[]
  title?: string
}
```

**Step 2: Implement fetchYouTubeChannelFeed function**

```typescript
export async function fetchYouTubeChannelFeed(
  channelId: string
): Promise<ParsedVideo[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

  try {
    const parser = new Parser({
      customFields: {
        item: [
          ['yt:videoId', 'videoId'],
          ['yt:channelId', 'channelId'],
          ['media:group', 'mediaGroup']
        ]
      }
    })

    const feed = await parser.parseURL(feedUrl) as unknown as YouTubeFeed

    if (!feed.items || feed.items.length === 0) {
      return []
    }

    const channelName = feed.title || 'Unknown Channel'

    return feed.items.map((item): ParsedVideo => {
      const videoId = (item as any).videoId || item.id?.split(':').pop() || ''
      const channelIdFromFeed = (item as any).channelId || channelId
      const thumbnail = (item as any).mediaGroup?.['media:thumbnail']?.[0]?.$?.url ||
                       `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      const description = (item as any).mediaGroup?.['media:description'] ||
                         item.contentSnippet ||
                         ''

      if (!videoId) {
        throw new RSSParseError(
          `Failed to extract video ID from feed item`,
          channelId
        )
      }

      return {
        youtube_id: videoId,
        channel_id: channelIdFromFeed,
        channel_name: channelName,
        title: item.title || 'Untitled',
        description,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        thumbnail_url: thumbnail
      }
    })
  } catch (error) {
    if (error instanceof RSSParseError) {
      throw error
    }

    const statusCode = (error as any)?.statusCode ||
                      (error as any)?.response?.status

    if (statusCode === 404) {
      throw new RSSFetchError(
        `Channel feed not found (404) - channel may be deleted or private`,
        channelId,
        404
      )
    }

    throw new RSSFetchError(
      `Failed to fetch RSS feed: ${(error as Error).message}`,
      channelId,
      statusCode
    )
  }
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 4: Commit**

```bash
git add lib/rss/youtube-parser.ts
git commit -m "feat: implement YouTube RSS parser"
```

---

## Task 4: Update Job Queue Types

**Files:**
- Modify: `lib/jobs/queue.ts`

**Step 1: Add rss_fetch_channel to JobType**

Find the `JobType` type definition and update:

```typescript
export type JobType =
  | 'fetch_transcript'
  | 'summarize_video'
  | 'score_video'
  | 'generate_embedding'
  | 'rss_fetch_channel'
```

**Step 2: Add getBatchJobs function for batch processing**

Add after the `getNextJob` function:

```typescript
export async function getBatchJobs(
  jobType: JobType,
  limit: number = 20
) {
  const supabase = createServerClient()

  const { data } = await supabase
    .from('job_queue')
    .select()
    .eq('job_type', jobType)
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  return data || []
}

export async function markJobRunning(jobId: string, attempts: number) {
  const supabase = createServerClient()

  await supabase
    .from('job_queue')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      attempts: attempts + 1
    })
    .eq('id', jobId)
}

export async function markJobFailed(
  jobId: string,
  error: string,
  shouldRetry: boolean
) {
  const supabase = createServerClient()

  await supabase
    .from('job_queue')
    .update({
      status: shouldRetry ? 'pending' : 'failed',
      error
    })
    .eq('id', jobId)
}

export async function checkPendingJob(
  jobType: JobType,
  channelId: string
): Promise<boolean> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from('job_queue')
    .select('id')
    .eq('job_type', jobType)
    .in('status', ['pending', 'running'])
    .eq('payload->>channel_youtube_id', channelId)
    .limit(1)
    .maybeSingle()

  return !!data
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 4: Commit**

```bash
git add lib/jobs/queue.ts
git commit -m "feat: add RSS job queue utilities"
```

---

## Task 5: RSS Job Processor - Core Logic

**Files:**
- Create: `lib/rss/process-channel-job.ts`

**Step 1: Create job processor function**

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { fetchYouTubeChannelFeed } from './youtube-parser'
import { RSSFetchError, RSSParseError } from './errors'

interface JobPayload {
  channel_youtube_id: string
  channel_name?: string
  triggered_by: 'manual' | 'cron'
}

interface ProcessResult {
  success: boolean
  videosProcessed: number
  cardsCreated: number
  error?: string
}

export async function processChannelJob(
  jobId: string,
  payload: JobPayload
): Promise<ProcessResult> {
  const supabase = createServerClient()
  const { channel_youtube_id: channelId } = payload

  try {
    // Fetch RSS feed
    const videos = await fetchYouTubeChannelFeed(channelId)

    if (videos.length === 0) {
      return { success: true, videosProcessed: 0, cardsCreated: 0 }
    }

    let cardsCreated = 0

    // Process each video
    for (const video of videos) {
      // Upsert video
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .upsert({
          youtube_id: video.youtube_id,
          channel_id: video.channel_id,
          channel_name: video.channel_name,
          title: video.title,
          description: video.description,
          published_at: video.published_at,
          thumbnail_url: video.thumbnail_url,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'youtube_id',
          ignoreDuplicates: false
        })
        .select('id')
        .single()

      if (videoError) {
        console.error(`Failed to upsert video ${video.youtube_id}:`, videoError)
        continue
      }

      // Find profiles with this channel as a source
      const { data: profileSources } = await supabase
        .from('profile_sources')
        .select('profile_id, profiles!inner(is_active)')
        .eq('source_type', 'channel')
        .eq('source_value', channelId)

      if (!profileSources || profileSources.length === 0) {
        continue
      }

      // Create cards for each profile
      for (const source of profileSources) {
        // @ts-ignore - Supabase join type
        if (!source.profiles?.is_active) continue

        // Check if card already exists
        const { data: existingCard } = await supabase
          .from('profile_video_cards')
          .select('id')
          .eq('profile_id', source.profile_id)
          .eq('video_id', videoData.id)
          .maybeSingle()

        if (existingCard) {
          continue
        }

        // Create new card
        const { error: cardError } = await supabase
          .from('profile_video_cards')
          .insert({
            profile_id: source.profile_id,
            video_id: videoData.id,
            column_status: 'inbox',
            position: 0
          })

        if (!cardError) {
          cardsCreated++
        }
      }
    }

    // Update channel last_checked_at
    await supabase
      .from('channels')
      .update({ last_checked_at: new Date().toISOString() })
      .eq('youtube_id', channelId)

    return {
      success: true,
      videosProcessed: videos.length,
      cardsCreated
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      videosProcessed: 0,
      cardsCreated: 0,
      error: errorMessage
    }
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 3: Commit**

```bash
git add lib/rss/process-channel-job.ts
git commit -m "feat: implement RSS channel job processor"
```

---

## Task 6: Cron Endpoint - Process Jobs

**Files:**
- Modify: `app/api/cron/ingest-channels/route.ts`

**Step 1: Implement job processing logic**

Replace the entire file content:

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getBatchJobs, markJobRunning, markJobFailed, completeJob } from '@/lib/jobs/queue'
import { processChannelJob } from '@/lib/rss/process-channel-job'

export const runtime = 'nodejs'
export const maxDuration = 60

const BATCH_SIZE = 20
const TIMEOUT_BUFFER_MS = 10000 // Stop 10s before timeout

export async function GET(request: Request) {
  const startTime = Date.now()

  // Verify authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  let processed = 0
  let succeeded = 0
  let failed = 0

  try {
    // Fetch batch of pending jobs
    const jobs = await getBatchJobs('rss_fetch_channel', BATCH_SIZE)

    // Log job run start
    const { data: jobRun } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'rss_fetch_channel',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    const jobRunId = jobRun?.id

    // Process each job
    for (const job of jobs) {
      // Check timeout
      const elapsed = Date.now() - startTime
      const maxDurationMs = (maxDuration || 60) * 1000
      if (elapsed > maxDurationMs - TIMEOUT_BUFFER_MS) {
        console.log(`Approaching timeout, stopping after ${processed} jobs`)
        break
      }

      processed++

      try {
        // Mark job as running
        await markJobRunning(job.id, job.attempts)

        // Process the job
        const result = await processChannelJob(job.id, job.payload as any)

        if (result.success) {
          // Mark as completed
          await completeJob(job.id)
          succeeded++
        } else {
          // Handle failure
          const shouldRetry = job.attempts < (job.max_attempts || 3)

          if (shouldRetry) {
            await markJobFailed(job.id, result.error || 'Unknown error', true)
          } else {
            // Max attempts reached - mark failed and create alert
            await markJobFailed(job.id, result.error || 'Unknown error', false)

            const payload = job.payload as any
            await supabase
              .from('alerts')
              .insert({
                alert_type: 'feed_error',
                title: `Failed to fetch channel: ${payload.channel_name || payload.channel_youtube_id}`,
                message: result.error || 'Unknown error after 3 attempts',
                is_read: false
              })
          }
          failed++
        }
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)
        const errorMsg = error instanceof Error ? error.message : String(error)
        const shouldRetry = job.attempts < (job.max_attempts || 3)
        await markJobFailed(job.id, errorMsg, shouldRetry)
        failed++
      }
    }

    // Update job run
    if (jobRunId) {
      const endTime = Date.now()
      await supabase
        .from('job_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_ms: endTime - startTime,
          items_processed: processed
        })
        .eq('id', jobRunId)
    }

    return NextResponse.json({
      success: true,
      processed,
      succeeded,
      failed
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal error',
        processed,
        succeeded,
        failed
      },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 3: Test manually (requires CRON_SECRET in .env.local)**

Run: `curl -H "Authorization: Bearer your-secret" http://localhost:3000/api/cron/ingest-channels`

Expected: JSON response with processed: 0 (no jobs yet)

**Step 4: Commit**

```bash
git add app/api/cron/ingest-channels/route.ts
git commit -m "feat: implement RSS job processing cron endpoint"
```

---

## Task 7: Manual Trigger - Global Refresh API

**Files:**
- Create: `app/api/rss/refresh/route.ts`

**Step 1: Implement global refresh endpoint**

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enqueueJob, checkPendingJob } from '@/lib/jobs/queue'

export async function POST() {
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 3: Commit**

```bash
git add app/api/rss/refresh/route.ts
git commit -m "feat: implement global RSS refresh API"
```

---

## Task 8: Manual Trigger - Per-Profile Refresh API

**Files:**
- Create: `app/api/rss/refresh/[profileId]/route.ts`

**Step 1: Implement per-profile refresh endpoint**

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enqueueJob, checkPendingJob } from '@/lib/jobs/queue'
import { isValidUUID } from '@/lib/utils/validation'

export async function POST(
  request: Request,
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 3: Commit**

```bash
git add app/api/rss/refresh/[profileId]/route.ts
git commit -m "feat: implement per-profile RSS refresh API"
```

---

## Task 9: Dashboard UI - Global Refresh Button

**Files:**
- Modify: `app/(main)/dashboard/page.tsx`

**Step 1: Add refresh state and handler**

After the existing imports, add:

```typescript
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
```

Inside the component, before the return statement, add:

```typescript
const [isRefreshing, setIsRefreshing] = useState(false)

const handleRefreshAll = async () => {
  setIsRefreshing(true)
  try {
    const response = await fetch('/api/rss/refresh', {
      method: 'POST'
    })
    const data = await response.json()

    if (response.ok) {
      // TODO: Show toast notification
      console.log(`Checking ${data.enqueued} channels for new videos...`)
    } else {
      console.error('Refresh failed:', data.error)
    }
  } catch (error) {
    console.error('Refresh error:', error)
  } finally {
    setIsRefreshing(false)
  }
}
```

**Step 2: Add refresh button to UI**

Find the section with the "New Profile" button and add the refresh button before it:

```typescript
<button
  onClick={handleRefreshAll}
  disabled={isRefreshing}
  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
>
  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
  {isRefreshing ? 'Refreshing...' : 'Refresh All'}
</button>
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 4: Test in browser**

Run: `npm run dev`

Navigate to dashboard, click "Refresh All" button

Expected: Button shows spinner, console logs result

**Step 5: Commit**

```bash
git add app/(main)/dashboard/page.tsx
git commit -m "feat: add global refresh button to dashboard"
```

---

## Task 10: Board UI - Per-Profile Refresh Button

**Files:**
- Modify: `components/board/kanban-board.tsx` (or wherever the board component lives)

**Step 1: Find the board component file**

Run: `find . -name "*board*.tsx" -o -name "*kanban*.tsx" | grep -v node_modules`

**Step 2: Add refresh functionality**

Note: Adjust based on your actual board component structure. Add near the profile title:

```typescript
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

// Inside component
const [isRefreshing, setIsRefreshing] = useState(false)

const handleRefresh = async () => {
  setIsRefreshing(true)
  try {
    const response = await fetch(`/api/rss/refresh/${profileId}`, {
      method: 'POST'
    })
    const data = await response.json()

    if (response.ok) {
      console.log(`Checking ${data.enqueued} channels for new videos...`)
      // Optionally refetch cards after a delay
      setTimeout(() => {
        // Trigger card refetch if using react-query
      }, 2000)
    } else {
      console.error('Refresh failed:', data.error)
    }
  } catch (error) {
    console.error('Refresh error:', error)
  } finally {
    setIsRefreshing(false)
  }
}

// In JSX, near profile title
<button
  onClick={handleRefresh}
  disabled={isRefreshing}
  className="p-2 hover:bg-gray-800 rounded disabled:opacity-50"
  title="Refresh videos"
>
  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
</button>
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 4: Test in browser**

Navigate to a profile board, click refresh icon

Expected: Icon spins, console logs result

**Step 5: Commit**

```bash
git add components/board/kanban-board.tsx
git commit -m "feat: add per-profile refresh button to board"
```

---

## Task 11: Environment Variables - Add CRON_SECRET

**Files:**
- Modify: `.env.local`
- Create: `.env.example` (if doesn't exist)

**Step 1: Add CRON_SECRET to .env.local**

Add this line:

```
CRON_SECRET=your-random-secret-here-change-in-production
```

**Step 2: Create or update .env.example**

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=random-secret-for-cron-authentication
```

**Step 3: Verify app starts**

Run: `npm run dev`

Expected: App starts without errors

**Step 4: Commit .env.example only (NOT .env.local)**

```bash
git add .env.example
git commit -m "docs: add CRON_SECRET to env example"
```

---

## Task 12: Integration Testing - Manual Test Flow

**Files:**
- None (manual testing)

**Step 1: Prepare test data**

In Supabase dashboard or via SQL:

```sql
-- Insert test channel
INSERT INTO channels (youtube_id, name, trust_score)
VALUES ('UCXuqSBlHAE6Xw-yeJA0Tunw', 'Linus Tech Tips', 50)
ON CONFLICT (youtube_id) DO NOTHING;

-- Create test profile
INSERT INTO profiles (name, type)
VALUES ('Test RSS Profile', 'channel_stack')
RETURNING id;

-- Add channel source (use profile id from above)
INSERT INTO profile_sources (profile_id, source_type, source_value)
VALUES ('your-profile-id', 'channel', 'UCXuqSBlHAE6Xw-yeJA0Tunw');
```

**Step 2: Test global refresh**

Run: `curl -X POST http://localhost:3000/api/rss/refresh`

Expected: `{"enqueued":1,"skipped":0}`

**Step 3: Verify job in queue**

```sql
SELECT * FROM job_queue WHERE job_type = 'rss_fetch_channel';
```

Expected: See 1 pending job

**Step 4: Process job via cron**

Run: `curl -H "Authorization: Bearer your-secret" http://localhost:3000/api/cron/ingest-channels`

Expected: `{"success":true,"processed":1,"succeeded":1,"failed":0}`

**Step 5: Verify videos created**

```sql
SELECT COUNT(*) FROM videos WHERE channel_id = 'UCXuqSBlHAE6Xw-yeJA0Tunw';
```

Expected: Count > 0 (typically ~15 videos from RSS)

**Step 6: Verify cards created**

```sql
SELECT COUNT(*) FROM profile_video_cards WHERE profile_id = 'your-profile-id';
```

Expected: Count matches video count

**Step 7: Document results**

Create: `docs/testing/rss-integration-test-results.md`

```markdown
# RSS Integration Test Results

**Date**: 2026-01-08
**Tester**: [Your name]

## Test Flow

1. Global refresh: ✅ Enqueued 1 job
2. Job queue: ✅ Job visible in pending state
3. Cron processing: ✅ Processed 1 job successfully
4. Videos created: ✅ 15 videos inserted
5. Cards created: ✅ 15 cards in inbox column

## Issues Found

- None

## Notes

- RSS parser correctly handles YouTube feed format
- Upsert logic prevents duplicates
- Cards appear in inbox as expected
```

**Step 8: Commit test results**

```bash
git add docs/testing/rss-integration-test-results.md
git commit -m "test: document RSS integration test results"
```

---

## Task 13: Error Handling Test - Invalid Channel

**Files:**
- None (manual testing)

**Step 1: Add invalid channel source**

```sql
INSERT INTO profile_sources (profile_id, source_type, source_value)
VALUES ('your-profile-id', 'channel', 'INVALID_CHANNEL_ID');
```

**Step 2: Trigger refresh**

Run: `curl -X POST http://localhost:3000/api/rss/refresh`

Expected: Job enqueued

**Step 3: Process job**

Run: `curl -H "Authorization: Bearer your-secret" http://localhost:3000/api/cron/ingest-channels`

Expected: Job fails, gets marked for retry

**Step 4: Process 2 more times (to exhaust retries)**

Run the cron command 2 more times

Expected: After 3rd attempt, job marked as failed

**Step 5: Verify alert created**

```sql
SELECT * FROM alerts WHERE alert_type = 'feed_error';
```

Expected: See alert with error message

**Step 6: Clean up test data**

```sql
DELETE FROM profile_sources WHERE source_value = 'INVALID_CHANNEL_ID';
DELETE FROM alerts WHERE alert_type = 'feed_error';
```

**Step 7: Document results**

Update `docs/testing/rss-integration-test-results.md` with error handling section

**Step 8: Commit**

```bash
git add docs/testing/rss-integration-test-results.md
git commit -m "test: verify RSS error handling and retry logic"
```

---

## Task 14: Update DEVLOG

**Files:**
- Modify: `DEVLOG.md`

**Step 1: Add new entry**

Add at the top of the file:

```markdown
## 2026-01-08 - RSS Ingestion System

### What We Attempted
- Implement YouTube channel RSS feed ingestion
- Build dual-trigger system (manual + cron)
- Create job queue processing with retries and alerts

### What Shipped
- YouTube RSS parser with error handling
- Job processor with batch processing and timeout safety
- Global refresh API (`/api/rss/refresh`)
- Per-profile refresh API (`/api/rss/refresh/[profileId]`)
- Cron endpoint for hourly processing (`/api/cron/ingest-channels`)
- Dashboard "Refresh All" button
- Board per-profile refresh button
- Feed error alerts after max retries
- ~750 lines across 10 files

### Decisions Made
- **RSS-first approach**: Use free YouTube RSS feeds, no API quota needed
- **Batch processing**: Process 20 jobs per cron run with timeout buffer
- **One job per channel**: Granular tracking and retry logic
- **Upsert videos**: Keep metadata fresh on each fetch
- **Card deduplication**: Check before inserting to prevent duplicates

### Risks Introduced or Removed
- [+] RSS feeds can be flaky (mitigated with retry logic)
- [+] No rate limiting on manual refresh APIs yet
- [-] Videos now auto-discovered and appear in inbox
- [-] Graceful error handling with user-visible alerts

### Follow-ups / TODOs
- [ ] Add toast notifications for refresh actions
- [ ] Add rate limiting to refresh APIs
- [ ] Show last_checked_at timestamps in UI
- [ ] Set up Vercel Cron or external cron service
- [ ] Consider YouTube Data API enrichment for view counts

### Technical Notes
- **rss-parser custom fields**: Use customFields to extract yt: namespaced tags
- **Job queue batch processing**: Grab N jobs, process sequentially with timeout checks
- **Supabase upsert**: `onConflict: 'youtube_id'` with `ignoreDuplicates: false` updates existing
- **Alert creation**: Only after max_attempts exhausted (3 retries)
```

**Step 2: Commit**

```bash
git add DEVLOG.md
git commit -m "docs: update DEVLOG with RSS ingestion implementation"
```

---

## Task 15: Deployment Configuration - Vercel Cron

**Files:**
- Create: `vercel.json`

**Step 1: Create Vercel cron configuration**

```json
{
  "crons": [{
    "path": "/api/cron/ingest-channels",
    "schedule": "0 * * * *"
  }]
}
```

**Step 2: Add deployment notes to README**

Update README.md with deployment section:

```markdown
## Deployment

### Environment Variables

Required in production:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `CRON_SECRET` - Random secret for authenticating cron requests

### Cron Setup

**Option 1: Vercel Cron (Paid plans)**
- Configured in `vercel.json`
- Runs automatically every hour
- No additional setup needed

**Option 2: External Cron Service**
- Use cron-job.org or similar
- URL: `https://yourdomain.com/api/cron/ingest-channels`
- Schedule: `0 * * * *` (every hour)
- Header: `Authorization: Bearer {CRON_SECRET}`
```

**Step 3: Commit**

```bash
git add vercel.json README.md
git commit -m "feat: add Vercel cron configuration and deployment docs"
```

---

## Completion Checklist

- [ ] Task 1: Database migration applied
- [ ] Task 2: Error classes created
- [ ] Task 3: YouTube RSS parser implemented
- [ ] Task 4: Job queue utilities updated
- [ ] Task 5: Job processor logic implemented
- [ ] Task 6: Cron endpoint working
- [ ] Task 7: Global refresh API working
- [ ] Task 8: Per-profile refresh API working
- [ ] Task 9: Dashboard refresh button added
- [ ] Task 10: Board refresh button added
- [ ] Task 11: CRON_SECRET configured
- [ ] Task 12: Integration test passed
- [ ] Task 13: Error handling verified
- [ ] Task 14: DEVLOG updated
- [ ] Task 15: Deployment config added

## Success Criteria

✅ Clicking "Refresh All" enqueues jobs for all channels
✅ Cron endpoint processes jobs and creates cards
✅ Videos appear in profile inbox after refresh
✅ Failed channels create alerts after 3 retries
✅ No duplicate cards created
✅ Existing videos get metadata updates

## Post-Implementation

**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch after all tasks complete.
