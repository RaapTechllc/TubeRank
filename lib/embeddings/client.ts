const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent'
const TIMEOUT_MS = 30000 // 30s for embedding calls

/**
 * Generate embedding for text using Gemini Embedding API
 * 
 * @param text - Text to embed (max 10000 chars)
 * @returns 768-dimensional embedding vector
 * 
 * Cost: ~$0.15 per 1M tokens
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is required')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, 10000) }] } // Limit text length
      }),
      signal: controller.signal
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: res.statusText } }))
      throw new Error(`Gemini API error: ${error.error?.message || res.statusText}`)
    }

    const data = await res.json()
    return data.embedding.values
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Calculate cosine similarity between two vectors
 * 
 * @returns Value between -1 (opposite) and 1 (identical)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0
    const bVal = b[i] ?? 0
    dotProduct += aVal * bVal
    normA += aVal * aVal
    normB += bVal * bVal
  }
  
  // Guard against division by zero
  if (normA === 0 || normB === 0) return 0
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Batch cosine similarity calculation
 */
export function batchCosineSimilarity(
  query: number[],
  targets: number[][]
): number[] {
  return targets.map(target => cosineSimilarity(query, target))
}
