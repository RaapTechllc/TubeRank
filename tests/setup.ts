import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.mock('@/lib/config/env', () => ({
  getEnv: vi.fn(() => ({
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    CRON_SECRET: 'a'.repeat(32),
    RATE_LIMIT_GLOBAL_REQUESTS: 3,
    RATE_LIMIT_GLOBAL_WINDOW: 300000,
    RATE_LIMIT_PROFILE_REQUESTS: 10,
    RATE_LIMIT_PROFILE_WINDOW: 60000,
    JOB_BATCH_SIZE: 20,
    JOB_TIMEOUT_BUFFER_MS: 10000,
    JOB_MAX_ATTEMPTS: 3,
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  })),
  validateEnv: vi.fn(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => createMockSupabaseClient()),
}))

// Mock Supabase browser client
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => createMockSupabaseClient()),
}))

// Helper to create mock Supabase client
function createMockSupabaseClient() {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  }

  return {
    from: vi.fn(() => mockQueryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  }
}

// Export for use in tests
export { createMockSupabaseClient }
