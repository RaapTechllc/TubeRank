import {
  calculateRelevance,
  calculateNovelty,
  calculateActionability,
  calculateCredibility,
  calculateEfficiency
} from './dimensions'
import { createServerClient } from '@/lib/supabase/server'

// Default score weights (must sum to 100)
export const DEFAULT_SCORE_WEIGHTS = {
  relevance: 35,
  novelty: 20,
  actionability: 20,
  credibility: 15,
  efficiency: 10
} as const

export interface ScoreWeights {
  relevance: number
  novelty: number
  actionability: number
  credibility: number
  efficiency: number
}

interface ScoreInput {
  videoId: string
  profileId: string
  summary: {
    long_summary: string
    key_ideas?: Array<unknown>
    action_items?: Array<{ item: string }>
    claims_to_verify?: Array<{ status?: string }>
  }
  profile: {
    name: string
    system_prompt: string | null
    score_weights: ScoreWeights | null
  }
  video: {
    duration_seconds: number | null
  }
  transcriptLength: number
}

/**
 * Score a video using 5 dimensions
 * 
 * Dimensions:
 * - Relevance: Embedding similarity to profile
 * - Novelty: Distance from existing summaries
 * - Actionability: Action items, frameworks, steps
 * - Credibility: Citations, verified claims
 * - Efficiency: Ideas per minute, compression
 */
export async function scoreVideo(input: ScoreInput) {
  const { videoId, profileId, summary, profile, video, transcriptLength } = input
  const supabase = createServerClient()

  // Calculate async dimensions in parallel
  const [relevance, novelty] = await Promise.all([
    calculateRelevance(summary.long_summary, profile.name, profile.system_prompt),
    calculateNovelty(summary.long_summary, profileId)
  ])
  
  // Calculate sync dimensions
  const actionability = calculateActionability(summary)
  const credibility = calculateCredibility(summary)
  const efficiency = calculateEfficiency(summary, video.duration_seconds, transcriptLength)

  // Calculate weighted overall score
  const weights = profile.score_weights || DEFAULT_SCORE_WEIGHTS
  const overall = Math.round(
    relevance * (weights.relevance / 100) +
    novelty * (weights.novelty / 100) +
    actionability * (weights.actionability / 100) +
    credibility * (weights.credibility / 100) +
    efficiency * (weights.efficiency / 100)
  )

  // Calculate time saved (video duration - summary read time)
  const summaryReadTime = Math.round((summary.long_summary.split(/\s+/).length / 250) * 60) // 250 wpm
  const timeSaved = Math.max((video.duration_seconds || 0) - summaryReadTime, 0)

  // Generate explanation
  const explanation = generateExplanation({
    relevance, novelty, actionability, credibility, efficiency, overall
  })

  // Store score
  const { data, error } = await supabase
    .from('scores')
    .upsert({
      video_id: videoId,
      profile_id: profileId,
      overall_score: overall,
      relevance_score: relevance,
      novelty_score: novelty,
      actionability_score: actionability,
      credibility_score: credibility,
      efficiency_score: efficiency,
      time_saved_seconds: timeSaved,
      explanation,
      weights_used: weights
    }, { onConflict: 'video_id,profile_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

function generateExplanation(scores: Record<string, number | undefined>): string {
  const parts: string[] = []
  
  const relevance = scores.relevance ?? 0
  const novelty = scores.novelty ?? 0
  const actionability = scores.actionability ?? 0
  const efficiency = scores.efficiency ?? 0
  const credibility = scores.credibility ?? 0
  const overall = scores.overall ?? 0
  
  if (relevance >= 85) parts.push(`High relevance (${relevance}).`)
  if (novelty >= 80) parts.push(`High novelty (${novelty}).`)
  if (actionability >= 80) parts.push(`Highly actionable (${actionability}).`)
  if (efficiency < 50) parts.push(`Low efficiency (${efficiency}).`)
  if (credibility < 50) parts.push(`Low credibility (${credibility}).`)
  
  return parts.join(' ') || `Score: ${overall}/100`
}

export {
  calculateRelevance,
  calculateNovelty,
  calculateActionability,
  calculateCredibility,
  calculateEfficiency
} from './dimensions'
