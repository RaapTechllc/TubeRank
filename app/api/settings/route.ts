import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const settingsSchema = z.object({
  digest_enabled: z.boolean().optional(),
  default_score_threshold: z.number().min(0).max(100).optional(),
})

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('digest_enabled, default_score_threshold')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch user settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Return default values if no settings exist
    const defaultSettings = {
      digest_enabled: true,
      default_score_threshold: 75,
    }

    return NextResponse.json({ settings: settings || defaultSettings })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = createServerClient()

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .update(parsed.data)
        .eq('id', existingSettings.id)
        .select()
        .single()

      if (error) {
        console.error('Failed to update settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
      }

      return NextResponse.json({ settings: data })
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('user_settings')
        .insert(parsed.data)
        .select()
        .single()

      if (error) {
        console.error('Failed to create settings:', error)
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
      }

      return NextResponse.json({ settings: data })
    }
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}