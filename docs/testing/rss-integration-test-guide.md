# RSS Integration Test Guide

**Date**: 2026-01-08
**Feature**: YouTube RSS Feed Ingestion System

## Prerequisites

Before running tests, ensure:
- ✅ Database migration applied (feed_error alert type)
- ✅ `.env.local` configured with DATABASE_URL and CRON_SECRET
- ✅ Development server running (`npm run dev`)

## Test 1: Database Migration

**Objective**: Verify feed_error alert type exists

**Steps**:
```sql
-- Run in Supabase SQL Editor or via psql
\d alerts
```

**Expected Result**:
- Check constraint includes 'feed_error' in the alert_type enum

**Manual Step Required**:
```sql
-- If not applied, run this in Supabase SQL Editor:
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

---

## Test 2: Prepare Test Data

**Objective**: Create test profile with YouTube channel source

**Steps**:
```sql
-- 1. Insert test channel (Linus Tech Tips)
INSERT INTO channels (youtube_id, name, trust_score)
VALUES ('UCXuqSBlHAE6Xw-yeJA0Tunw', 'Linus Tech Tips', 50)
ON CONFLICT (youtube_id) DO NOTHING;

-- 2. Create test profile (if you don't have one)
INSERT INTO profiles (name, type, is_active)
VALUES ('Test RSS Profile', 'channel_stack', true)
RETURNING id;
-- Note the returned ID

-- 3. Add channel source (replace YOUR_PROFILE_ID with the ID from step 2)
INSERT INTO profile_sources (profile_id, source_type, source_value)
VALUES ('YOUR_PROFILE_ID', 'channel', 'UCXuqSBlHAE6Xw-yeJA0Tunw');
```

**Expected Result**: Profile created with channel source linked

---

## Test 3: Global Refresh API

**Objective**: Test manual job enqueuing via global refresh endpoint

**Steps**:
```bash
# Call the global refresh API
curl -X POST http://localhost:3000/api/rss/refresh

# Or use the "Refresh All" button in the dashboard UI
```

**Expected Result**:
```json
{
  "enqueued": 1,
  "skipped": 0
}
```

**Verify in Database**:
```sql
SELECT * FROM job_queue
WHERE job_type = 'rss_fetch_channel'
ORDER BY created_at DESC
LIMIT 5;
```

Expected: See 1 pending job with payload containing channel_youtube_id

---

## Test 4: Per-Profile Refresh API

**Objective**: Test profile-specific refresh endpoint

**Steps**:
```bash
# Replace PROFILE_ID with your test profile ID
curl -X POST http://localhost:3000/api/rss/refresh/PROFILE_ID

# Or use the refresh icon on the profile board page
```

**Expected Result**:
```json
{
  "enqueued": 1,
  "skipped": 0
}
```

If you call it again immediately:
```json
{
  "enqueued": 0,
  "skipped": 1
}
```
(Because job is already pending/running)

---

## Test 5: Cron Job Processing

**Objective**: Process queued jobs via cron endpoint

**Steps**:
```bash
# Replace YOUR_CRON_SECRET with the value from .env.local
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/ingest-channels
```

**Expected Result**:
```json
{
  "success": true,
  "processed": 1,
  "succeeded": 1,
  "failed": 0
}
```

**Verify Videos Created**:
```sql
SELECT COUNT(*) as video_count
FROM videos
WHERE channel_id = 'UCXuqSBlHAE6Xw-yeJA0Tunw';
```

Expected: ~15 videos (YouTube RSS feeds return ~15 recent videos)

**Verify Cards Created**:
```sql
SELECT COUNT(*) as card_count
FROM profile_video_cards
WHERE profile_id = 'YOUR_PROFILE_ID';
```

Expected: Same count as videos (one card per video in inbox)

**Verify Job Completed**:
```sql
SELECT status, completed_at
FROM job_queue
WHERE job_type = 'rss_fetch_channel'
ORDER BY created_at DESC
LIMIT 1;
```

Expected: status = 'completed', completed_at is set

---

## Test 6: Error Handling - Invalid Channel

**Objective**: Verify retry logic and alert creation on persistent failures

**Steps**:

**1. Add invalid channel source**:
```sql
INSERT INTO profile_sources (profile_id, source_type, source_value)
VALUES ('YOUR_PROFILE_ID', 'channel', 'INVALID_CHANNEL_ID');
```

**2. Trigger refresh**:
```bash
curl -X POST http://localhost:3000/api/rss/refresh/YOUR_PROFILE_ID
```

**3. Process job (will fail)**:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/ingest-channels
```

Expected response:
```json
{
  "success": true,
  "processed": 1,
  "succeeded": 0,
  "failed": 1
}
```

**4. Verify job marked for retry**:
```sql
SELECT status, attempts, error
FROM job_queue
WHERE job_type = 'rss_fetch_channel'
  AND payload->>'channel_youtube_id' = 'INVALID_CHANNEL_ID';
```

Expected: status = 'pending', attempts = 1, error message present

**5. Process 2 more times** (to exhaust 3 max attempts):
```bash
# Run this 2 more times
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/ingest-channels
```

**6. Verify final failure and alert**:
```sql
-- Check job is marked failed
SELECT status, attempts
FROM job_queue
WHERE payload->>'channel_youtube_id' = 'INVALID_CHANNEL_ID';
-- Expected: status = 'failed', attempts = 3

-- Check alert created
SELECT * FROM alerts
WHERE alert_type = 'feed_error'
ORDER BY created_at DESC
LIMIT 1;
```

Expected: Alert with title mentioning "INVALID_CHANNEL_ID"

**7. Cleanup**:
```sql
DELETE FROM profile_sources
WHERE source_value = 'INVALID_CHANNEL_ID';

DELETE FROM job_queue
WHERE payload->>'channel_youtube_id' = 'INVALID_CHANNEL_ID';

DELETE FROM alerts
WHERE alert_type = 'feed_error';
```

---

## Test 7: Duplicate Prevention

**Objective**: Verify no duplicate videos or cards are created on re-ingestion

**Steps**:

**1. Clear existing jobs**:
```sql
DELETE FROM job_queue WHERE job_type = 'rss_fetch_channel';
```

**2. Trigger refresh again**:
```bash
curl -X POST http://localhost:3000/api/rss/refresh/YOUR_PROFILE_ID
```

**3. Process the job**:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/ingest-channels
```

**4. Verify counts unchanged**:
```sql
-- Should be same count as before (no duplicates)
SELECT COUNT(*) FROM videos
WHERE channel_id = 'UCXuqSBlHAE6Xw-yeJA0Tunw';

SELECT COUNT(*) FROM profile_video_cards
WHERE profile_id = 'YOUR_PROFILE_ID';
```

Expected: Counts remain the same (upsert prevents duplicates)

---

## Test 8: UI Testing

**Objective**: Verify UI interactions work correctly

**Dashboard Test**:
1. Navigate to http://localhost:3000/dashboard
2. Click "Refresh All" button
3. Verify:
   - Button shows "Refreshing..." with spinning icon
   - Console logs: "Checking N channels for new videos..."
   - Button returns to "Refresh All" state

**Profile Board Test**:
1. Navigate to profile page (http://localhost:3000/profile/YOUR_PROFILE_ID)
2. Click refresh icon (circular arrow near Settings)
3. Verify:
   - Icon spins while processing
   - Console logs job count
   - After ~2 seconds, new videos appear in inbox column (if any new videos exist)

---

## Success Criteria Checklist

- ✅ Migration applied successfully
- ✅ Global refresh enqueues jobs for all active profile channels
- ✅ Per-profile refresh enqueues jobs for specific profile channels
- ✅ Cron endpoint processes jobs and creates videos/cards
- ✅ Videos appear in profile inbox after processing
- ✅ Failed channels retry 3 times then create alerts
- ✅ No duplicate videos or cards created on re-ingestion
- ✅ UI buttons provide visual feedback during refresh
- ✅ Existing video metadata updated on re-fetch

---

## Common Issues

**Issue**: `psql: command not found`
**Solution**: Run the migration SQL directly in Supabase SQL Editor

**Issue**: `Unauthorized` when calling cron endpoint
**Solution**: Verify CRON_SECRET matches between .env.local and curl command

**Issue**: No videos fetched
**Solution**:
- Verify channel ID is correct
- Check channel feed URL manually: `https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA0Tunw`
- Check job error message in database

**Issue**: Cards not appearing in UI
**Solution**:
- Verify profile is marked as `is_active = true`
- Check profile_sources link exists
- Refresh the page (react-query cache)

---

## Next Steps After Testing

1. Set up automated cron trigger (Vercel Cron or external service)
2. Add toast notifications for user feedback
3. Monitor job_runs table for processing metrics
4. Consider adding rate limiting to manual refresh endpoints
