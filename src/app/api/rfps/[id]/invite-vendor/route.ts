import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'

import VendorInviteEmail from '@/emails/vendor-invite'
import { logActivity } from '@/lib/activity'
import { getRequestAuth } from '@/lib/api/auth'
import {
  apiError,
  forbidden,
  unauthorized,
  validationError,
} from '@/lib/api/responses'
import { appUrl, sendEmail } from '@/lib/email'
import { formatDate } from '@/lib/format'
import { vendorInviteSchema } from '@/lib/schemas/vendor-invite'

const INVITE_TTL_MS = 72 * 60 * 60 * 1000 // Backend Schema §2.4

/**
 * POST /api/rfps/[id]/invite-vendor (PM) — creates (or reuses) the org's
 * vendor_account for this email, adds the vendor to the RFP, stores a
 * 72-hour invite token and emails the invite link.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { supabase, claims } = await getRequestAuth()
  if (!claims) return unauthorized()
  if (claims.role !== 'procurement_manager') return forbidden()

  const parsed = vendorInviteSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) return validationError(parsed.error)
  const { email, companyName, personalMessage } = parsed.data

  const { data: rfp } = await supabase
    .from('rfps')
    .select('id, title, submission_deadline, organisations(name)')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .maybeSingle()
  if (!rfp) return apiError('RFP not found.', 'not_found', 404)

  // One vendor_account per email per org (vendor_email_per_org index).
  const { data: existing } = await supabase
    .from('vendor_accounts')
    .select('id, company_name')
    .eq('is_deleted', false)
    .ilike('email', email.replace(/[\\%_]/g, '\\$&'))
    .maybeSingle()

  let vendorId = existing?.id
  if (vendorId) {
    const { data: entry } = await supabase
      .from('rfp_vendor_entries')
      .select('id')
      .eq('rfp_id', rfp.id)
      .eq('vendor_account_id', vendorId)
      .maybeSingle()
    if (entry) {
      return apiError(
        'This vendor has already been invited to this RFP.',
        'duplicate_invite',
        409
      )
    }
  } else {
    const { data: created, error } = await supabase
      .from('vendor_accounts')
      .insert({
        org_id: claims.orgId,
        company_name: companyName,
        // Replaced with the vendor's own name when they accept the invite.
        contact_name: email,
        email,
      })
      .select('id')
      .single()
    if (error) {
      return apiError('Could not create the vendor.', 'insert_failed', 500)
    }
    vendorId = created.id
  }

  const { data: entry, error: entryError } = await supabase
    .from('rfp_vendor_entries')
    .insert({
      org_id: claims.orgId,
      rfp_id: rfp.id,
      vendor_account_id: vendorId,
      status: 'invited',
    })
    .select()
    .single()
  if (entryError) {
    return apiError(
      'Could not add the vendor to this RFP.',
      'insert_failed',
      500
    )
  }

  const token = randomBytes(32).toString('hex') // 64 chars
  const { error: inviteError } = await supabase.from('vendor_invites').insert({
    org_id: claims.orgId,
    rfp_id: rfp.id,
    vendor_account_id: vendorId,
    invited_by: claims.userId,
    token,
    personal_message: personalMessage,
    expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
  })
  if (inviteError) {
    return apiError('Could not create the invite.', 'insert_failed', 500)
  }

  const inviteUrl = appUrl(`/vendor/invite/${token}`)
  const { sent } = await sendEmail({
    to: email,
    subject: `Invitation to respond: ${rfp.title}`,
    template: VendorInviteEmail({
      orgName: rfp.organisations?.name ?? 'A procurement team',
      rfpTitle: rfp.title,
      submissionDeadline: rfp.submission_deadline
        ? formatDate(rfp.submission_deadline)
        : null,
      personalMessage,
      inviteUrl,
    }),
    devLink: inviteUrl,
  })

  await logActivity({
    actor: claims,
    entityType: 'rfp_vendor_entry',
    entityId: entry.id,
    action: 'vendor.invited',
    description: `${existing?.company_name ?? companyName} invited to "${rfp.title}"`,
    after: entry,
    metadata: {
      rfp_id: rfp.id,
      vendor_account_id: vendorId,
      email,
      email_sent: sent,
    },
  })

  return NextResponse.json({ entry, emailSent: sent }, { status: 201 })
}
