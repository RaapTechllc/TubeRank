import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createSourceSchema } from '@/lib/validations/profile'
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
    .from('profile_sources')
    .select('*')
    .eq('profile_id', id)
    .order('created_at', { ascending: false })
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

async function handlePOST(request: NextRequest, { params }: Params) {
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
  
  const parsed = createSourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  
  const supabase = createServerClient()
  
  const { data, error: dbError } = await supabase
    .from('profile_sources')
    .insert({ ...parsed.data, profile_id: id })
    .select()
    .single()
  
  if (dbError) {
    if (dbError.code === '23505') {
      return NextResponse.json({ error: 'Source already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}

async function handleDELETE(request: NextRequest, { params }: Params) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { id } = await params
  
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  }
  
  const { searchParams } = new URL(request.url)
  const sourceId = searchParams.get('sourceId')
  
  if (!sourceId) {
    return NextResponse.json({ error: 'sourceId required' }, { status: 400 })
  }
  
  if (!isValidUUID(sourceId)) {
    return NextResponse.json({ error: 'Invalid source ID' }, { status: 400 })
  }
  
  const supabase = createServerClient()
  
  const { error: dbError } = await supabase
    .from('profile_sources')
    .delete()
    .eq('id', sourceId)
    .eq('profile_id', id)
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}

export const GET = withRateLimit(handleGET, RATE_LIMITS.API)
export const POST = withRateLimit(handlePOST, RATE_LIMITS.API)
export const DELETE = withRateLimit(handleDELETE, RATE_LIMITS.API)