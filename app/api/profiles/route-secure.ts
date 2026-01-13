import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createProfileSchema } from '@/lib/validations/profile'
import { requireAuth } from '@/lib/middleware/auth'

export async function GET() {
  const { error, user } = await requireAuth()
  if (error) return error
  
  const supabase = createServerClient()
  
  const { data, error: dbError } = await supabase
    .from('profiles')
    .select('*, profile_sources(*)')
    .order('created_at', { ascending: false })
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { error, user } = await requireAuth()
  if (error) return error
  
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  
  const parsed = createProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  
  const supabase = createServerClient()
  
  const { data, error: dbError } = await supabase
    .from('profiles')
    .insert(parsed.data)
    .select()
    .single()
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
