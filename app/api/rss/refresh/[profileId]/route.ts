import { NextResponse, NextRequest } from 'next/server'
import { isValidUUID } from '@/lib/utils/validation'
import { withRateLimitByKey } from '@/lib/rate-limit/middleware'
import { RATE_LIMITS } from '@/lib/rate-limit/config'
import { refreshChannels } from '@/lib/rss/refresh-helper'

async function handlePOST(
  request: NextRequest,
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

  try {
    const result = await refreshChannels({ profileId })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Per-profile refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// Extract profile ID synchronously for rate limit key extraction
function extractProfileId(_request: NextRequest, context: { params: Promise<{ profileId: string }> }): string {
  const params = context.params as unknown as { profileId: string }
  return params?.profileId ?? 'unknown'
}

// Export rate-limited handler with profile-specific keys
export const POST = withRateLimitByKey(
  handlePOST,
  RATE_LIMITS.PROFILE_REFRESH,
  extractProfileId
)
