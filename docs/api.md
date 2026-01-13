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

## Endpoints

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
    "profile_sources": [...]
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

#### GET /api/profiles/[id]
Get a specific profile by ID.

#### PUT /api/profiles/[id]
Update a profile.

#### DELETE /api/profiles/[id]
Delete a profile.

### Cards

#### GET /api/profiles/[id]/cards
Get cards for a profile with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

#### PATCH /api/cards/[id]
Update a card's status or properties.

### Analytics

#### GET /api/analytics/performance
Get performance metrics.

#### GET /api/analytics/channel-health
Get channel health statistics.

### Settings

#### GET /api/settings
Get user settings.

#### PUT /api/settings
Update user settings.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

**Status Codes:**
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error
