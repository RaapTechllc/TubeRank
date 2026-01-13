import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { updateProfileSchema } from '@/lib/validations/profile'
import { isValidUUID } from '@/lib/utils/validation'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  }
  
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*, profile_sources(*)')
    .eq('id', id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: Params) {
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

  // Filter out updated_at and created_at - let database handle these
  const { updated_at: _, created_at: __, ...updateData } = parsed.data as Record<string, unknown>

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  }
  
  const supabase = createServerClient()
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
