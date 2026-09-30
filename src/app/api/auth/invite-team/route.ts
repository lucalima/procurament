import { NextResponse } from 'next/server'

import { getRequestAuth } from '@/lib/api/auth'
import { forbidden, unauthorized, validationError } from '@/lib/api/responses'
import { inviteTeamSchema } from '@/lib/schemas/auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/auth/invite-team (PM only) — emails invites to internal team
 * members. Supabase creates the auth user immediately, and handle_new_user()
 * creates their profile in the PM's org from the invite metadata.
 */
export async function POST(request: Request) {
  const { claims } = await getRequestAuth()
  if (!claims) return unauthorized()
  if (claims.role !== 'procurement_manager') return forbidden()

  const parsed = inviteTeamSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) return validationError(parsed.error)

  const admin = createAdminClient()
  const results = await Promise.all(
    parsed.data.invites.map(async ({ email, role }) => {
      const { error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { role, org_id: claims.orgId },
      })
      if (!error) return { email, status: 'sent' as const }
      return {
        email,
        status: 'failed' as const,
        error:
          error.code === 'email_exists'
            ? 'This email already has an account.'
            : 'The invite could not be sent.',
      }
    })
  )

  const sent = results.filter((r) => r.status === 'sent').length
  return NextResponse.json({ sent, results }, { status: sent ? 200 : 400 })
}
