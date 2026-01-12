import { z } from 'zod'

export const scoreWeightsSchema = z.object({
  relevance: z.number().min(0).max(100),
  novelty: z.number().min(0).max(100),
  actionability: z.number().min(0).max(100),
  credibility: z.number().min(0).max(100),
  efficiency: z.number().min(0).max(100),
}).refine(data => {
  const sum = data.relevance + data.novelty + data.actionability + data.credibility + data.efficiency
  return sum === 100
}, { message: 'Weights must sum to 100' })

export const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['channel_stack', 'video_set', 'keyword_radar', 'category_pulse', 'custom']),
  system_prompt: z.string().max(2000).optional(),
  score_weights: scoreWeightsSchema.optional(),
})

export const updateProfileSchema = createProfileSchema.partial()

export const createSourceSchema = z.object({
  source_type: z.enum(['channel', 'video', 'keyword', 'category']),
  source_value: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CreateProfileInput = z.infer<typeof createProfileSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateSourceInput = z.infer<typeof createSourceSchema>
