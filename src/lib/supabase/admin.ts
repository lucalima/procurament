import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

/**
 * Service-role Supabase client. Bypasses RLS, so it may only be imported by
 * server code (Route Handlers, cron jobs) and never by a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
