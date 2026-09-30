import { readAppClaims, type AppClaims } from '@/lib/auth/claims'
import { createClient } from '@/lib/supabase/server'

/**
 * Verifies the caller's session in a Route Handler and returns their claims
 * together with an RLS-scoped Supabase client. Claims are null when the caller
 * is signed out or deactivated.
 */
export async function getRequestAuth(): Promise<{
  supabase: ReturnType<typeof createClient>
  claims: AppClaims | null
}> {
  const supabase = createClient()
  const { data } = await supabase.auth.getClaims()
  return { supabase, claims: readAppClaims(data?.claims) }
}
