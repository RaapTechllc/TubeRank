import { NextResponse } from 'next/server'
import { refreshChannels } from '@/lib/rss/refresh-helper'

export async function POST() {
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
