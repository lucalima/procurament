import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

/**
 * Supabase client for Client Components: real-time subscriptions and
 * client-side mutations. Runs under RLS as the signed-in user.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
