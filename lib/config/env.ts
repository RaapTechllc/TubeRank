import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url().optional(),

  // Cron
  CRON_SECRET: z.string().min(32),

  // Rate Limiting
  RATE_LIMIT_GLOBAL_REQUESTS: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10)
    return val
  }, z.number().min(1).max(100).default(3)),
  RATE_LIMIT_GLOBAL_WINDOW: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10)
    return val
  }, z.number().min(1000).default(5 * 60 * 1000)),
  RATE_LIMIT_PROFILE_REQUESTS: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10)
    return val
  }, z.number().min(1).max(100).default(10)),
  RATE_LIMIT_PROFILE_WINDOW: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10)
    return val
  }, z.number().min(1000).default(60 * 1000)),

  // Job Processing
  JOB_BATCH_SIZE: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10)
    return val
  }, z.number().min(1).max(100).default(20)),
  JOB_TIMEOUT_BUFFER_MS: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10)
    return val
  }, z.number().min(1000).default(10000)),
  JOB_MAX_ATTEMPTS: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10)
    return val
  }, z.number().min(1).max(10).default(3)),

  // External APIs (optional)
  YOUTUBE_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
})

let validatedEnv: z.infer<typeof envSchema> | null = null

export function getEnv() {
  if (validatedEnv) {
    return validatedEnv
  }

  try {
    validatedEnv = envSchema.parse(process.env)
    return validatedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e) => e.path.join('.')).join(', ')
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}\n\n` +
        `Please check your .env.local file and ensure all required variables are set.`
      )
    }
    throw error
  }
}

export function validateEnv() {
  getEnv()
}
