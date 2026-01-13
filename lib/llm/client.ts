const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const TIMEOUT_MS = 60000 // 60s for LLM calls

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface JsonSchema {
  name: string
  strict: boolean
  schema: Record<string, unknown>
}

interface CompletionOptions {
  model: string
  messages: ChatMessage[]
  response_format?: {
    type: 'json_schema' | 'json_object'
    json_schema?: JsonSchema
  }
  temperature?: number
  max_tokens?: number
}

interface CompletionResponse {
  id: string
  choices: Array<{
    message: { content: string }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    cost?: number
  }
}

interface OpenRouterError {
  error: {
    code: number
    message: string
  }
}

/**
 * Make a chat completion request to OpenRouter
 * 
 * Uses JSON Schema for structured outputs and Response Healing plugin
 * to automatically extract JSON from markdown code blocks
 */
export async function complete(options: CompletionOptions): Promise<CompletionResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'TubeRank'
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        response_format: options.response_format,
        plugins: [{ id: 'response-healing' }], // Auto-extract JSON from markdown
        usage: { include: true }, // Include usage/cost in response
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens ?? 4096
      }),
      signal: controller.signal
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: { message: res.statusText } })) as OpenRouterError
      throw new Error(`OpenRouter error: ${errorData.error?.message || res.statusText}`)
    }

    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Parse JSON response, handling markdown code blocks
 * 
 * Response Healing plugin should handle this, but this is a fallback
 */
export function parseJsonResponse<T>(content: string): T {
  try {
    return JSON.parse(content)
  } catch {
    // Try to extract from markdown code block
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match && match[1]) {
      return JSON.parse(match[1])
    }
    throw new Error('Failed to parse JSON response')
  }
}

// Model constants for consistent usage
export const MODELS = {
  EXTRACTION: 'google/gemini-2.0-flash-001', // $0.10/M input, $0.40/M output
  VERIFICATION: 'google/gemini-2.0-flash-lite-001', // Faster, cheaper
} as const
