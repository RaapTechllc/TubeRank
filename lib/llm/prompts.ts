export const EXTRACTION_PROMPT = `You are an expert at extracting valuable insights from video transcripts.

PROFILE CONTEXT:
Name: {profile_name}
Focus: {system_prompt}

TRANSCRIPT:
{transcript}

Extract the following in JSON format:

{
  "key_ideas": [
    {
      "idea": "The main insight or framework",
      "context": "Why this matters or how to apply it",
      "timestamp_hint": "Approximate location in video if mentioned"
    }
  ],
  "action_items": [
    {
      "item": "Specific action to take",
      "priority": "high|medium|low"
    }
  ],
  "claims_to_verify": [
    {
      "claim": "Factual claim made in the video",
      "context": "Surrounding context",
      "importance": "high|medium|low"
    }
  ],
  "entities": {
    "people": ["Names mentioned"],
    "companies": ["Companies mentioned"],
    "tools": ["Tools or products mentioned"],
    "concepts": ["Key concepts or frameworks"]
  },
  "tags": ["relevant", "topic", "tags"],
  "short_summary": "2-3 sentence summary",
  "long_summary": "Detailed 2-3 paragraph summary covering main points"
}

Focus on:
- Novel frameworks and mental models (not generic advice)
- Specific numbers, metrics, and data points
- Contrarian or surprising takes
- Actionable steps with clear outcomes
- Claims that can be fact-checked

Return ONLY valid JSON, no markdown.`

export const VERIFICATION_PROMPT = `You are a fact-checker verifying claims from a video summary.

CLAIMS TO VERIFY:
{claims}

For each claim, assess:
1. Is this verifiable or opinion?
2. Does it align with your knowledge?
3. Are there any contradictions or caveats?

Return JSON:
{
  "verified_claims": [
    {
      "original_claim": "The claim text",
      "status": "verified|disputed|unverifiable|opinion",
      "confidence": 0-100,
      "context": "Additional context or correction",
      "sources_hint": "Where to verify if needed"
    }
  ]
}

Be conservative - mark as "unverifiable" if you're not confident.
Return ONLY valid JSON.`

export function buildExtractionPrompt(
  transcript: string,
  profileName: string,
  systemPrompt: string | null
): string {
  return EXTRACTION_PROMPT
    .replace('{transcript}', transcript.slice(0, 100000)) // Limit transcript length
    .replace('{profile_name}', profileName)
    .replace('{system_prompt}', systemPrompt || 'General knowledge extraction')
}

export function buildVerificationPrompt(claims: Array<{ claim: string; context: string }>): string {
  return VERIFICATION_PROMPT.replace(
    '{claims}',
    claims.map((c, i) => `${i + 1}. "${c.claim}" (Context: ${c.context})`).join('\n')
  )
}
