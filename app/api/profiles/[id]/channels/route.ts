import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils/validation'

type Params = { params: Promise<{ id: string }> }

/**
 * Get channels associated with a profile's sources
 * Returns channel data including last_checked_at for display
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Get channel sources for this profile
  const { data: sources, error: sourcesError } = await supabase
    .from('profile_sources')
    .select('source_value')
    .eq('profile_id', id)
    .eq('source_type', 'channel')

  if (sourcesError) {
    return NextResponse.json({ error: sourcesError.message }, { status: 500 })
  }

  if (!sources?.length) {
    return NextResponse.json({ channels: [], lastCheckedAt: null })
  }

  // Get channel IDs
  const channelIds = sources.map(s => s.source_value)

  // Get channel data including last_checked_at
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('youtube_id, name, last_checked_at, trust_score')
    .in('youtube_id', channelIds)

  if (channelsError) {
    return NextResponse.json({ error: channelsError.message }, { status: 500 })
  }

  // Find the most recent check time across all channels
  const lastCheckedAt = channels
    ?.map(c => c.last_checked_at)
    .filter((d): d is string => d !== null)
    .sort()
    .pop() ?? null

  return NextResponse.json({
    channels: channels || [],
    lastCheckedAt
  })
}
