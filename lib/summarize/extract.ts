import { complete, parseJsonResponse, MODELS } from '@/lib/llm/client'
import { buildExtractionPrompt } from '@/lib/llm/prompts'

export interface ExtractionResult {
  key_ideas: Array<{ idea: string; context: string; timestamp_hint?: string }>
  action_items: Array<{ item: string; priority: string }>
  claims_to_verify: Array<{ claim: string; context: string; importance: string }>
  entities: {
    people: string[]
    companies: string[]
    tools: string[]
    concepts: string[]
  }
  tags: string[]
  short_summary: string
  long_summary: string
  tokens_used: number
  model_used: string
}

/**
 * Extract key information from transcript (Pass 1)
 */
export async function extractFromTranscript(
  transcript: string,
  profileName: string,
  systemPrompt: string | null
): Promise<ExtractionResult> {
  const prompt = buildExtractionPrompt(transcript, profileName, systemPrompt)

  const response = await complete({
    model: MODELS.EXTRACTION,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from LLM')
  }

  const parsed = parseJsonResponse<Omit<ExtractionResult, 'tokens_used' | 'model_used'>>(content)

  return {
    ...parsed,
    tokens_used: response.usage.total_tokens,
    model_used: MODELS.EXTRACTION
  }
}
