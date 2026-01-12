import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit/middleware'
import { RATE_LIMITS } from '@/lib/rate-limit/config'
import { refreshChannels } from '@/lib/rss/refresh-helper'

async function handlePOST() {
  try {
    const result = await refreshChannels()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Global refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// Export rate-limited handler
export const POST = withRateLimit(handlePOST, RATE_LIMITS.GLOBAL_REFRESH)
