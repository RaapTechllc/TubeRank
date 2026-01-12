export interface DatabaseProfileSource {
  profiles: {
    is_active: boolean
  }
}

export interface DatabaseCardWithRelations {
  profile_video_cards: {
    id: string
    profile_id: string
    video_id: string
    column_status: 'inbox' | 'recommended' | 'skim' | 'watch' | 'archived'
    position: number
    created_at: string
    updated_at: string
  }
  videos: {
    id: string
    youtube_id: string
    channel_id: string
    channel_name: string | null
    title: string
    description: string | null
    published_at: string | null
    duration_seconds: number | null
    view_count: number | null
    like_count: number | null
    comment_count: number | null
    thumbnail_url: string | null
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
  }
  scores?: Array<{
    id: string
    video_id: string
    profile_id: string
    overall_score: number
    relevance_score: number | null
    novelty_score: number | null
    actionability_score: number | null
    credibility_score: number | null
    efficiency_score: number | null
    time_saved_seconds: number | null
    explanation: string | null
    created_at: string
  }>
  summaries?: Array<{
    id: string
    video_id: string
    profile_id: string
    version: number
    key_ideas: Array<{ idea: string; importance?: number }> | null
    action_items: Array<{ item: string; priority?: string }> | null
    claims_to_verify: Array<{ claim: string; status: string; context?: string }> | null
    short_summary: string | null
    long_summary: string | null
    entities: Record<string, string[]> | null
    tags: string[] | null
    summary_confidence: number
    model_used: string | null
    tokens_used: number | null
    created_at: string
  }>
}
