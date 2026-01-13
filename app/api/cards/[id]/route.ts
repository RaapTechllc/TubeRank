import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { isValidUUID } from '@/lib/utils/validation'

const updateCardSchema = z.object({
  column_status: z.enum(['inbox', 'recommended', 'skim', 'watch', 'archived']).optional(),
  position: z.number().int().min(0).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid card ID' }, { status: 400 })
  }
  
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  
  const parsed = updateCardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('profile_video_cards')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
