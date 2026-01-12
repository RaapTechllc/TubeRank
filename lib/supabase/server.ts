import { createClient } from '@supabase/supabase-js'
import { getEnv } from '@/lib/config/env'

export function createServerClient() {
  const env = getEnv()
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  )
}
