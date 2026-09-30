import { NextResponse } from 'next/server'

import { getRequestAuth } from '@/lib/api/auth'
import { apiError, forbidden, unauthorized } from '@/lib/api/responses'

/** PATCH /api/auth/onboarding/complete — marks the PM's onboarding wizard done. */
export async function PATCH() {
  const { supabase, claims } = await getRequestAuth()
  if (!claims) return unauthorized()
  if (claims.role !== 'procurement_manager') return forbidden()

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', claims.userId)

  if (error) {
    return apiError('Could not complete onboarding.', 'update_failed', 500)
  }
  return NextResponse.json({ onboardingComplete: true })
}
