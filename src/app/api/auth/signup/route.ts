import { NextResponse } from 'next/server'

import { apiError, validationError } from '@/lib/api/responses'
import { signupSchema } from '@/lib/schemas/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/** Matches the slug handle_new_user() derives from the org name (Backend Schema §6.2). */
function orgSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-')
}

/**
 * POST /api/auth/signup — creates the organisation and its Procurement
 * Manager. handle_new_user() builds the org and profile from the metadata.
 */
export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error)
  const { orgName, fullName, email, password } = parsed.data

  // organisations.slug is unique; a clash would otherwise surface as an opaque
  // "database error" from the signup trigger.
  const { data: existing } = await createAdminClient()
    .from('organisations')
    .select('id')
    .eq('slug', orgSlug(orgName))
    .maybeSingle()
  if (existing) {
    return apiError(
      'An organisation with this name already exists.',
      'org_name_taken',
      409
    )
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'procurement_manager',
        org_name: orgName,
        full_name: fullName,
      },
    },
  })

  if (error) {
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      return apiError(
        'An account with this email already exists.',
        'email_taken',
        409
      )
    }
    return apiError('We could not create your account.', 'signup_failed', 400)
  }

  return NextResponse.json(
    { userId: data.user?.id ?? null, signedIn: Boolean(data.session) },
    { status: 201 }
  )
}
