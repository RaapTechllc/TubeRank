import { generateEmbedding, cosineSimilarity } from './client'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Store embedding for a video/profile combination
 */
export async function storeEmbedding(
  videoId: string,
  profileId: string,
  text: string
): Promise<void> {
  const embedding = await generateEmbedding(text)
  const supabase = createServerClient()

  await supabase
    .from('embeddings')
    .upsert({
      video_id: videoId,
      profile_id: profileId,
      embedding: `[${embedding.join(',')}]`,
      source_type: 'summary'
    }, { onConflict: 'video_id,profile_id' })
}

/**
 * Get existing embeddings for a profile
 */
export async function getProfileEmbeddings(
  profileId: string,
  limit: number = 50
): Promise<number[][]> {
  const supabase = createServerClient()
  
  const { data } = await supabase
    .from('embeddings')
    .select('embedding')
    .eq('profile_id', profileId)
    .limit(limit)

  return (data || []).map(row => {
    const str = row.embedding as string
    return JSON.parse(str)
  })
}

/**
 * Calculate novelty score for new content
 * 
 * @returns Score 0-100 (higher = more novel)
 */
export async function calculateNoveltyScore(
  summaryText: string,
  profileId: string
): Promise<number> {
  const summaryEmbedding = await generateEmbedding(summaryText)
  const existingEmbeddings = await getProfileEmbeddings(profileId)

  if (existingEmbeddings.length === 0) return 100 // First video is fully novel

  const maxSimilarity = Math.max(
    ...existingEmbeddings.map(e => cosineSimilarity(summaryEmbedding, e))
  )

  return Math.round((1 - maxSimilarity) * 100)
}

/**
 * Calculate relevance score against a profile's focus
 */
export async function calculateRelevanceScore(
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

export { generateEmbedding, cosineSimilarity, batchCosineSimilarity } from './client'
