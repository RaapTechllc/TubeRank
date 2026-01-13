import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { updateProfileSchema } from '@/lib/validations/profile'
import { isValidUUID } from '@/lib/utils/validation'
import { requireAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/rate-limit/middleware'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

type Params = { params: Promise<{ id: string }> }

async function handleGET(_request: NextRequest, { params }: Params) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { id } = await params
  
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  }
  
  const supabase = createServerClient()
  
  const { data, error: dbError } = await supabase
    .from('profiles')
    .select('*, profile_sources(*)')
    .eq('id', id)
    .single()
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

async function handlePUT(request: NextRequest, { params }: Params) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { id } = await params
  
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  }
  
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  
  const supabase = createServerClient()

  const { updated_at: _, created_at: __, ...updateData } = parsed.data as Record<string, unknown>

  const { data, error: dbError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

async function handleDELETE(_request: NextRequest, { params }: Params) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { id } = await params
  
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  }
  
  const supabase = createServerClient()
  
  const { error: dbError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}

export const GET = withRateLimit(handleGET, RATE_LIMITS.API)
export const PUT = withRateLimit(handlePUT, RATE_LIMITS.API)
export const DELETE = withRateLimit(handleDELETE, RATE_LIMITS.API)