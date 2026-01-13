import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const settingsSchema = z.object({
  digest_enabled: z.boolean().optional(),
  default_score_threshold: z.number().min(0).max(100).optional(),
})

export async function GET() {
  try {
    // Return default settings for now
    const defaultSettings = {
      digest_enabled: true,
      default_score_threshold: 75,
    }

    return NextResponse.json({ settings: defaultSettings })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: parsed.error.flatten() 
      }, { status: 400 })
    }

    // For now, just return the submitted settings
    // In production, this would save to database
    return NextResponse.json({ settings: parsed.data })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
