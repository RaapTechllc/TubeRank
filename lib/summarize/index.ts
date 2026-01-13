import { extractFromTranscript } from './extract'
import { verifyClaims } from './verify'
import { createServerClient } from '@/lib/supabase/server'

export interface SummarizeOptions {
  videoId: string
  profileId: string
  transcript: string
  profileName: string
  systemPrompt: string | null
}

/**
 * Full 2-pass summarization pipeline
 * 
 * Pass 1: Extract key information
 * Pass 2: Verify claims
 */
export async function summarizeVideo(options: SummarizeOptions) {
  const { videoId, profileId, transcript, profileName, systemPrompt } = options
  const supabase = createServerClient()

  // Pass 1: Extract
  const extraction = await extractFromTranscript(transcript, profileName, systemPrompt)

  // Pass 2: Verify claims
  const verification = await verifyClaims(
    extraction.claims_to_verify.map(c => ({ claim: c.claim, context: c.context }))
  )

  // Merge verification results into claims
  const claimsWithVerification = extraction.claims_to_verify.map(claim => {
    const verified = verification.verified_claims.find(
      v => v.original_claim === claim.claim
    )
    return {
      ...claim,
      status: verified?.status || 'unverifiable',
      verification_context: verified?.context,
      confidence: verified?.confidence
    }
  })

  // Store summary
  const { data, error } = await supabase
    .from('summaries')
    .upsert({
      video_id: videoId,
      profile_id: profileId,
      key_ideas: extraction.key_ideas,
      action_items: extraction.action_items,
      claims_to_verify: claimsWithVerification,
      short_summary: extraction.short_summary,
      long_summary: extraction.long_summary,
      entities: extraction.entities,
      tags: extraction.tags,
      model_used: extraction.model_used,
      system_prompt_used: systemPrompt,
      tokens_used: extraction.tokens_used + verification.tokens_used
    }, {
      onConflict: 'video_id,profile_id'
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export { extractFromTranscript } from './extract'
export { verifyClaims } from './verify'
