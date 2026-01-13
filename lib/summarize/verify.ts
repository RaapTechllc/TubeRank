import { complete, parseJsonResponse, MODELS } from '@/lib/llm/client'
import { buildVerificationPrompt } from '@/lib/llm/prompts'

export interface VerifiedClaim {
  original_claim: string
  status: 'verified' | 'disputed' | 'unverifiable' | 'opinion'
  confidence: number
  context: string
  sources_hint?: string
}

export interface VerificationResult {
  verified_claims: VerifiedClaim[]
  tokens_used: number
}

/**
 * Verify claims from extraction (Pass 2)
 */
export async function verifyClaims(
  claims: Array<{ claim: string; context: string }>
): Promise<VerificationResult> {
  if (claims.length === 0) {
    return { verified_claims: [], tokens_used: 0 }
  }

  // Only verify up to 10 claims to save tokens
  const claimsToVerify = claims.slice(0, 10)
  const prompt = buildVerificationPrompt(claimsToVerify)

  const response = await complete({
    model: MODELS.VERIFICATION,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    return { verified_claims: [], tokens_used: response.usage.total_tokens }
  }

  const parsed = parseJsonResponse<{ verified_claims: VerifiedClaim[] }>(content)

  return {
    verified_claims: parsed.verified_claims,
    tokens_used: response.usage.total_tokens
  }
}
