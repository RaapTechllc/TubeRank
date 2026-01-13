import { generateEmbedding, cosineSimilarity, calculateNoveltyScore } from '@/lib/embeddings'

/**
 * Calculate relevance score (embedding similarity to profile)
 */
export async function calculateRelevance(
  summaryText: string,
  profileName: string,
  systemPrompt: string | null
): Promise<number> {
  const summaryEmbedding = await generateEmbedding(summaryText)
  const profileText = `${profileName} ${systemPrompt || ''}`
  const profileEmbedding = await generateEmbedding(profileText)
  
  const similarity = cosineSimilarity(summaryEmbedding, profileEmbedding)
  return Math.round(Math.max(0, Math.min(100, similarity * 100)))
}

/**
 * Calculate novelty score (1 - max similarity to existing)
 */
export async function calculateNovelty(
  summaryText: string,
  profileId: string
): Promise<number> {
  return calculateNoveltyScore(summaryText, profileId)
}

/**
 * Calculate actionability score based on action items, frameworks, etc.
 */
export function calculateActionability(summary: {
  action_items?: Array<{ item: string }>
  long_summary?: string
}): number {
  let score = 0
  
  // Count action items (up to 30 points)
  const actionCount = summary.action_items?.length || 0
  score += Math.min(actionCount * 10, 30)
  
  // Check for frameworks and methods (up to 25 points)
  const text = summary.long_summary || ''
  const frameworks = (text.match(/framework|model|method|system|approach/gi) || []).length
  score += Math.min(frameworks * 8, 25)
  
  // Check for specific numbers and metrics (up to 20 points)
  const numbers = (text.match(/\d+%|\$\d+|\d+x|\d+ (percent|million|billion)/gi) || []).length
  score += Math.min(numbers * 4, 20)
  
  // Check for step-by-step instructions (25 points)
  const hasSteps = /step \d|first,|second,|then,|finally,/i.test(text)
  score += hasSteps ? 25 : 0
  
  return Math.min(score, 100)
}

/**
 * Calculate credibility score based on citations and verified claims
 */
export function calculateCredibility(summary: {
  claims_to_verify?: Array<{ status?: string }>
  long_summary?: string
}): number {
  let score = 50 // Base score
  
  // Check for citations (up to 15 points)
  const text = summary.long_summary || ''
  const citations = (text.match(/according to|research shows|study found|et al\./gi) || []).length
  score += Math.min(citations * 3, 15)
  
  // Check verified claims ratio (up to 15 points)
  const claims = summary.claims_to_verify || []
  const verifiedCount = claims.filter(c => c.status === 'verified').length
  const verifiedRatio = claims.length > 0 ? verifiedCount / claims.length : 0.5
  score += Math.round(verifiedRatio * 15)
  
  // Check for specific facts (up to 10 points)
  const specifics = (text.match(/\d{4}|\d+%|specifically|exactly/gi) || []).length
  score += Math.min(specifics * 2, 10)
  
  return Math.min(Math.max(score, 0), 100)
}

/**
 * Calculate efficiency score (ideas per minute, compression ratio)
 */
export function calculateEfficiency(
  summary: { key_ideas?: Array<unknown>; long_summary?: string },
  durationSeconds: number | null,
  transcriptLength: number
): number {
  if (!durationSeconds || durationSeconds === 0) return 50
  
  const durationMinutes = durationSeconds / 60
  
  // Ideas per minute (up to 40 points, target 0.75 ideas/min)
  const keyIdeasCount = summary.key_ideas?.length || 0
  const ideasPerMinute = keyIdeasCount / durationMinutes
  const ideasScore = Math.min((ideasPerMinute / 0.75) * 40, 40)
  
  // Compression ratio (up to 30 points)
  const summaryWords = (summary.long_summary || '').split(/\s+/).length
  const compressionRatio = transcriptLength > 0 ? 1 - (summaryWords / transcriptLength) : 0.5
  const compressionScore = compressionRatio * 30
  
  return Math.min(Math.max(Math.round(ideasScore + compressionScore), 0), 100)
}
