/**
 * Card service for business logic
 */
import { CardRepository } from '@/lib/repositories'
import type { CardWithVideo } from '@/types'

export class CardService {
  private cardRepo: CardRepository

  constructor(supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>) {
    this.cardRepo = new CardRepository(supabase)
  }

  /**
   * Get cards for a profile
   * @param profileId - Profile ID
   * @param fields - Optional comma-separated fields to select
   * @returns Array of cards with video data
   */
  async getCardsForProfile(profileId: string, fields?: string): Promise<CardWithVideo[]> {
    return this.cardRepo.findByProfileId(profileId, fields)
  }

  /**
   * Move card to different column
   * @param cardId - Card ID
   * @param columnStatus - New column status
   * @param position - New position
   * @returns Updated card
   */
  async moveCard(
    cardId: string,
    columnStatus: 'inbox' | 'recommended' | 'skim' | 'watch' | 'archived',
    position: number
  ): Promise<CardWithVideo> {
    return this.cardRepo.move(cardId, columnStatus, position)
  }

  /**
   * Batch move multiple cards efficiently
   * @param moves - Array of card moves
   * @returns Array of updated cards
   */
  async batchMoveCards(moves: Array<{ cardId: string; columnStatus: 'inbox' | 'recommended' | 'skim' | 'watch' | 'archived'; position: number }>) {
    const batchMoves = moves.map(move => ({
      id: move.cardId,
      columnStatus: move.columnStatus,
      position: move.position
    }))
    
    return this.cardRepo.batchMove(batchMoves)
  }

  /**
   * Update card
   * @param cardId - Card ID
   * @param updates - Fields to update
   * @returns Updated card
   */
  async updateCard(cardId: string, updates: Record<string, unknown>): Promise<CardWithVideo> {
    return this.cardRepo.update(cardId, updates)
  }

  /**
   * Batch update multiple cards efficiently
   * @param updates - Array of card updates
   * @returns Array of updated cards
   */
  async batchUpdateCards(updates: Array<{ cardId: string; updates: Record<string, unknown> }>) {
    const batchUpdates = updates.map(update => ({
      id: update.cardId,
      updates: update.updates
    }))
    
    return this.cardRepo.batchUpdate(batchUpdates)
  }

  /**
   * Batch delete multiple cards efficiently
   * @param cardIds - Array of card IDs to delete
   * @returns Number of deleted cards
   */
  async batchDeleteCards(cardIds: string[]) {
    return this.cardRepo.batchDelete(cardIds)
  }
}