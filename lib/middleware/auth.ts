import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Authentication middleware for API routes
 * Verifies user authentication and returns user data
 */
export async function requireAuth() {
  const supabase = createServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null
    }
  }
  
  return { error: null, user }
}

/**
 * Wrapper for API routes that require authentication
 */
export function withAuth<T extends any[]>(
  handler: (user: any, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const { error, user } = await requireAuth()
    
    if (error) {
      return error
    }
    
    return handler(user, ...args)
  }
}
