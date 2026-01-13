import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/rate-limit/middleware'
import { RATE_LIMITS } from '@/lib/rate-limit/config'
import { CardService } from '@/lib/services/card-service'

const batchUpdateSchema = z.object({
  updates: z.array(z.object({
    cardId: z.string().uuid(),
    columnStatus: z.enum(['inbox', 'recommended', 'skim', 'watch', 'archived']).optional(),
    position: z.number().int().min(0).optional(),
  })).min(1).max(100) // Limit batch size
})

const batchDeleteSchema = z.object({
  cardIds: z.array(z.string().uuid()).min(1).max(100)
})

async function handlePATCH(request: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = batchUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServerClient()
  const cardService = new CardService(supabase)

  try {
    // Separate moves from other updates
    const moves = parsed.data.updates
      .filter(update => update.columnStatus !== undefined && update.position !== undefined)
      .map(update => ({
        cardId: update.cardId,
        columnStatus: update.columnStatus!,
        position: update.position!
      }))

    const otherUpdates = parsed.data.updates
      .filter(update => !(update.columnStatus !== undefined && update.position !== undefined))
      .map(update => ({
        cardId: update.cardId,
        updates: {
          ...(update.columnStatus && { column_status: update.columnStatus }),
          ...(update.position !== undefined && { position: update.position })
        }
      }))

    const results = []

    // Batch move cards efficiently
    if (moves.length > 0) {
      const moveResults = await cardService.batchMoveCards(moves)
      results.push(...moveResults)
    }

    // Batch update other fields
    if (otherUpdates.length > 0) {
      const updateResults = await cardService.batchUpdateCards(otherUpdates)
      results.push(...updateResults)
    }

    return NextResponse.json({
      updated: results.length,
      cards: results
    })
  } catch (error) {
    console.error('Batch update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

async function handleDELETE(request: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = batchDeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServerClient()
  const cardService = new CardService(supabase)

  try {
    const deletedCount = await cardService.batchDeleteCards(parsed.data.cardIds)
    
    return NextResponse.json({
      deleted: deletedCount,
      cardIds: parsed.data.cardIds
    })
  } catch (error) {
    console.error('Batch delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

export const PATCH = withRateLimit(handlePATCH, RATE_LIMITS.API)
export const DELETE = withRateLimit(handleDELETE, RATE_LIMITS.API)