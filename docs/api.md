# TubeRank API Documentation

## Authentication

All API endpoints require authentication via Supabase Auth. Include the user's JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- **General API**: 100 requests per minute per IP
- **Global Refresh**: 3 requests per 5 minutes per IP
- **Profile Refresh**: 10 requests per minute per IP per profile

## Base URL

```
https://your-domain.com/api
```

## Endpoints

### Health Check

#### GET /api/health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 12345,
  "environment": "production",
  "version": "1.0.0"
}
```

#### GET /api/health/detailed
Get detailed health information including database connectivity.

### Profiles

#### GET /api/profiles
Get all profiles for the authenticated user.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Profile Name",
    "description": "Profile description",
    "created_at": "2024-01-01T00:00:00Z",
    "profile_sources": [
      {
        "id": "uuid",
        "source_type": "youtube_channel",
        "source_url": "https://youtube.com/@channel"
      }
    ]
  }
]
```

#### POST /api/profiles
Create a new profile.

**Request:**
```json
{
  "name": "Profile Name",
  "description": "Profile description"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Profile Name",
  "description": "Profile description",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### GET /api/profiles/[id]
Get a specific profile by ID.

#### PUT /api/profiles/[id]
Update a profile.

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### DELETE /api/profiles/[id]
Delete a profile.

### Cards

#### GET /api/profiles/[id]/cards
Get cards for a profile with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by column status (`inbox`, `recommended`, `skim`, `watch`, `archived`)

**Response:**
```json
{
  "cards": [
    {
      "id": "uuid",
      "title": "Video Title",
      "description": "Video description",
      "youtube_url": "https://youtube.com/watch?v=...",
      "column_status": "inbox",
      "position": 0,
      "score": 85,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### PATCH /api/cards/[id]
Update a single card's status or properties.

**Request:**
```json
{
  "column_status": "watch",
  "position": 5
}
```

#### PATCH /api/cards/batch
Batch update multiple cards.

**Request:**
```json
{
  "updates": [
    {
      "cardId": "uuid",
      "columnStatus": "watch",
      "position": 0
    },
    {
      "cardId": "uuid2",
      "columnStatus": "archived"
    }
  ]
}
```

**Response:**
```json
{
  "updated": 2,
  "cards": [...]
}
```

#### DELETE /api/cards/batch
Batch delete multiple cards.

**Request:**
```json
{
  "cardIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "deleted": 3,
  "cardIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Analytics

#### GET /api/analytics/performance
Get performance metrics.

**Response:**
```json
{
  "totalCards": 1250,
  "avgProcessingTime": 2.5,
  "successRate": 98.5,
  "errorRate": 1.5
}
```

#### GET /api/analytics/channel-health
Get channel health statistics.

**Response:**
```json
{
  "channels": [
    {
      "channelId": "uuid",
      "name": "Channel Name",
      "totalVideos": 150,
      "avgScore": 75.5,
      "lastUpdate": "2024-01-01T00:00:00Z",
      "status": "healthy"
    }
  ]
}
```

#### GET /api/analytics/workflow-funnel
Get workflow funnel analytics.

#### GET /api/analytics/velocity
Get processing velocity metrics.

#### GET /api/analytics/score-distribution
Get score distribution analytics.

### Settings

#### GET /api/settings
Get user settings.

**Response:**
```json
{
  "settings": {
    "digest_enabled": true,
    "default_score_threshold": 75
  }
}
```

#### PUT /api/settings
Update user settings.

**Request:**
```json
{
  "digest_enabled": false,
  "default_score_threshold": 80
}
```

**Response:**
```json
{
  "settings": {
    "digest_enabled": false,
    "default_score_threshold": 80
  }
}
```

### RSS & Processing

#### POST /api/rss/refresh
Trigger RSS refresh for all profiles.

#### POST /api/rss/refresh/[profileId]
Trigger RSS refresh for a specific profile.

### Background Jobs

#### POST /api/jobs/fetch-transcript
Fetch transcript for a video.

#### POST /api/jobs/summarize-video
Generate video summary.

#### POST /api/jobs/score-video
Calculate video score.

#### POST /api/jobs/generate-embedding
Generate video embedding.

### Cron Jobs (Internal)

#### POST /api/cron/daily-digest
Generate daily digest (cron only).

#### POST /api/cron/ingest-channels
Ingest channel data (cron only).

#### POST /api/cron/process-ai-jobs
Process AI jobs queue (cron only).

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "details": {
    "field": ["Validation error details"]
  }
}
```

**Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error
- `503`: Service Unavailable (health check failed)

## Data Types

### Profile
```typescript
interface Profile {
  id: string
  name: string
  description?: string
  created_at: string
  profile_sources?: ProfileSource[]
}
```

### Card
```typescript
interface Card {
  id: string
  title: string
  description?: string
  youtube_url: string
  column_status: 'inbox' | 'recommended' | 'skim' | 'watch' | 'archived'
  position: number
  score?: number
  created_at: string
}
```

### Settings
```typescript
interface Settings {
  digest_enabled: boolean
  default_score_threshold: number
}
```
