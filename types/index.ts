export interface Profile {
  id: string
  name: string
  type: 'channel_stack' | 'video_set' | 'keyword_radar' | 'category_pulse' | 'custom'
  system_prompt?: string
  score_weights: ScoreWeights
  settings: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ScoreWeights {
  relevance: number
  novelty: number
  actionability: number
  credibility: number
  efficiency: number
}

export interface Video {
  id: string
  youtube_id: string
  channel_id: string
  channel_name?: string
  title: string
  description?: string
  published_at?: string
  duration_seconds?: number
  view_count?: number
  like_count?: number
  comment_count?: number
  thumbnail_url?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Transcript {
  id: string
  video_id: string
  source: 'official' | 'fetcher' | 'user' | 'asr'
  status: 'pending' | 'available' | 'failed' | 'none'
  content?: string
  language: string
  confidence?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Summary {
  id: string
  video_id: string
  profile_id: string
  version: number
  key_ideas?: Array<{ idea: string; importance?: number }>
  action_items?: Array<{ item: string; priority?: string }>
  claims_to_verify?: Array<{ claim: string; status: string; context?: string }>
  short_summary?: string
  long_summary?: string
  entities?: Record<string, string[]>
  tags?: string[]
  summary_confidence: number
  model_used?: string
  tokens_used?: number
  created_at: string
}

export interface Score {
  id: string
  video_id: string
  profile_id: string
  overall_score: number
  relevance_score?: number
  novelty_score?: number
  actionability_score?: number
  credibility_score?: number
  efficiency_score?: number
  time_saved_seconds?: number
  explanation?: string
  created_at: string
}

export interface ProfileVideoCard {
  id: string
  profile_id: string
  video_id: string
  column_status: 'inbox' | 'recommended' | 'skim' | 'watch' | 'archived'
  position: number
  created_at: string
  updated_at: string
}

export interface Channel {
  id: string
  youtube_id: string
  name: string
  description?: string
  thumbnail_url?: string
  subscriber_count?: number
  video_count?: number
  trust_score: number
  notes?: string
  followed_since: string
  last_checked_at?: string
  created_at: string
  updated_at: string
}


export interface ProfileSource {
  id: string
  profile_id: string
  source_type: 'channel' | 'video' | 'keyword' | 'category'
  source_value: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface ProfileWithSources extends Profile {
  profile_sources: ProfileSource[]
}

export interface CardWithVideo extends ProfileVideoCard {
  video: Video
  score?: Score
  summary?: Summary
}
