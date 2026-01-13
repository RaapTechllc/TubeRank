/**
 * Card repository for profile_video_cards operations
 */
export class CardRepository {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  /**
   * Get cards for a profile
   * @param profileId - Profile ID
   * @param fields - Optional comma-separated fields to select
   * @returns Array of cards
   */
  async findByProfileId(profileId: string, fields?: string) {
    let selectQuery = `
      id,
      profile_id,
      video_id,
      column_status,
      position,
      created_at,
      updated_at
    `

    if (fields) {
      const requestedFields = fields.split(',')
      if (requestedFields.includes('video')) {
        selectQuery += `,
          video:videos(
            id,
            youtube_id,
            title,
            thumbnail_url,
            channel_name,
            published_at,
            duration_seconds,
            view_count,
            like_count,
            comment_count
          )
        `
      }
      if (requestedFields.includes('score')) {
        selectQuery += `,
          score:scores(
            id,
            overall_score,
            relevance_score,
            novelty_score,
            actionability_score,
            credibility_score,
            efficiency_score
          )
        `
      }
      if (requestedFields.includes('summary')) {
        selectQuery += `,
          summary:summaries(
            id,
            short_summary,
            long_summary,
            key_ideas,
            action_items,
            summary_confidence
          )
        `
      }
    } else {
      selectQuery = `
        *,
        video:videos(*),
        score:scores(*),
        summary:summaries(*)
      `
    }

    const { data, error } = await this.supabase
      .from('profile_video_cards')
      .select(selectQuery)
      .eq('profile_id', profileId)
      .order('position', { ascending: true })

    if (error) throw error

    return data.map((card: any) => ({
      ...card,
      score: Array.isArray(card.score) ? card.score[0] : card.score,
      summary: Array.isArray(card.summary) ? card.summary[0] : card.summary,
    }))
  }

  /**
   * Update a card
   * @param cardId - Card ID
   * @param updates - Fields to update
   * @returns Updated card
   */
  async update(cardId: string, updates: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from('profile_video_cards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', cardId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Move card to different column
   * @param cardId - Card ID
   * @param columnStatus - New column status
   * @param position - New position
   * @returns Updated card
   */
  async move(cardId: string, columnStatus: string, position: number) {
    return this.update(cardId, { column_status: columnStatus, position })
  }
}
