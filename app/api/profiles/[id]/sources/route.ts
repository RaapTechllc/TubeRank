import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createSourceSchema } from '@/lib/validations/profile'
import { isValidUUID } from '@/lib/utils/validation'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  }
  
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('profile_sources')
    .select('*')
    .eq('profile_id', id)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: Params) {
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
  
  const { data, error } = await supabase
    .from('profile_sources')
    .insert({ ...parsed.data, profile_id: id })
    .select()
    .single()
  
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Source already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request, { params }: Params) {
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
  
  const { error } = await supabase
    .from('profile_sources')
    .delete()
    .eq('id', sourceId)
    .eq('profile_id', id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
