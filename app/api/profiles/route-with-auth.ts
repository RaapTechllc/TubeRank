import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createProfileSchema } from '@/lib/validations/profile'
import { requireAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/rate-limit/middleware'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

async function handleGET(request: Request) {
  const { error, user } = await requireAuth()
  if (error) return error
  
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10')))
  const offset = (page - 1) * limit
  
  const supabase = createServerClient()
  
  // Get total count
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  const { data, error: dbError } = await supabase
    .from('profiles')
    .select('*, profile_sources(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  const totalPages = Math.ceil((count || 0) / limit)
  
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  })
}

async function handlePOST(request: Request) {
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

export const GET = withRateLimit(handleGET, RATE_LIMITS.API)
export const POST = withRateLimit(handlePOST, RATE_LIMITS.API)