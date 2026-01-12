import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  try {
    // Get recent digest alerts (last 7 days)
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select(`
        id,
        profile_id,
        alert_type,
        title,
        message,
        created_at,
        is_read,
        profiles!inner(
          id,
          name
        )
      `)
      .eq('alert_type', 'category_digest')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch digest alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch digest data' }, { status: 500 })
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('Digest API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}