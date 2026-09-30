import { NextResponse } from 'next/server'

import { logActivity } from '@/lib/activity'
import { getRequestAuth } from '@/lib/api/auth'
import {
  apiError,
  forbidden,
  unauthorized,
  validationError,
} from '@/lib/api/responses'
import { RFP_STATUS } from '@/components/shared/status-badge'
import { rfpUpdateSchema } from '@/lib/schemas/rfp'
import type { TablesUpdate } from '@/types/database'

type Params = { params: { id: string } }

/**
 * GET /api/rfps/[id] (PM, DH, FA) — the RFP with its evaluation state and
 * vendor list: status, document and compliance-flag counts, and the weighted
 * score from the latest scoring run.
 */
export async function GET(_request: Request, { params }: Params) {
  const { supabase, claims } = await getRequestAuth()
  if (!claims) return unauthorized()
  if (claims.userType !== 'internal') return forbidden()

  const { data: rfp, error } = await supabase
    .from('rfps')
    .select('*, evaluations(id, status, scoring_run_count)')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .maybeSingle()
  if (error) return apiError('Could not load the RFP.', 'query_failed', 500)
  if (!rfp) return apiError('RFP not found.', 'not_found', 404)

  const { evaluations: evaluation, ...rfpFields } = rfp
  const [entries, submissions, criteria, scores] = await Promise.all([
    supabase
      .from('rfp_vendor_entries')
      .select(
        'id, status, is_shortlisted, created_at, vendor_accounts(id, company_name, contact_name, email, is_active)'
      )
      .eq('rfp_id', params.id)
      .order('created_at'),
    supabase
      .from('submissions')
      .select(
        'vendor_account_id, status, documents(id, compliance_flags(count))'
      )
      .eq('rfp_id', params.id),
    evaluation
      ? supabase
          .from('evaluation_criteria')
          .select('id, weight')
          .eq('evaluation_id', evaluation.id)
      : Promise.resolve({ data: [] as { id: string; weight: number }[] }),
    evaluation && evaluation.scoring_run_count > 0
      ? supabase
          .from('vendor_scores')
          .select('vendor_account_id, criterion_id, effective_score')
          .eq('evaluation_id', evaluation.id)
          .eq('scoring_run', evaluation.scoring_run_count)
      : Promise.resolve({
          data: [] as {
            vendor_account_id: string
            criterion_id: string
            effective_score: number | null
          }[],
        }),
  ])
  if ('error' in entries && entries.error) {
    return apiError('Could not load vendors.', 'query_failed', 500)
  }

  const weights = new Map((criteria.data ?? []).map((c) => [c.id, c.weight]))
  const vendors = (entries.data ?? []).map((entry) => {
    const vendorId = entry.vendor_accounts?.id
    const submission = submissions.data?.find(
      (s) => s.vendor_account_id === vendorId
    )
    const vendorScores = (scores.data ?? []).filter(
      (s) => s.vendor_account_id === vendorId && s.effective_score !== null
    )
    return {
      entry_id: entry.id,
      status: entry.status,
      is_shortlisted: entry.is_shortlisted,
      invited_at: entry.created_at,
      vendor: entry.vendor_accounts,
      submission_status: submission?.status ?? null,
      document_count: submission?.documents.length ?? 0,
      flag_count:
        submission?.documents.reduce(
          (sum, d) => sum + (d.compliance_flags[0]?.count ?? 0),
          0
        ) ?? 0,
      score: vendorScores.length
        ? Number(
            vendorScores
              .reduce(
                (sum, s) =>
                  sum +
                  (s.effective_score ?? 0) *
                    ((weights.get(s.criterion_id) ?? 0) / 100),
                0
              )
              .toFixed(2)
          )
        : null,
    }
  })

  return NextResponse.json({ rfp: rfpFields, evaluation, vendors })
}

/** PATCH /api/rfps/[id] (PM) — edit fields or change pipeline status. */
export async function PATCH(request: Request, { params }: Params) {
  const { supabase, claims } = await getRequestAuth()
  if (!claims) return unauthorized()
  if (claims.role !== 'procurement_manager') return forbidden()

  const parsed = rfpUpdateSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) return validationError(parsed.error)
  const v = parsed.data

  const { data: before } = await supabase
    .from('rfps')
    .select()
    .eq('id', params.id)
    .eq('is_deleted', false)
    .maybeSingle()
  if (!before) return apiError('RFP not found.', 'not_found', 404)

  const update: TablesUpdate<'rfps'> = {}
  if (v.title !== undefined) update.title = v.title
  if (v.description !== undefined) update.description = v.description
  if (v.department !== undefined) update.department = v.department
  if (v.budgetMin !== undefined) update.budget_min = v.budgetMin
  if (v.budgetMax !== undefined) update.budget_max = v.budgetMax
  if (v.submissionDeadline !== undefined) {
    update.submission_deadline = v.submissionDeadline
  }
  if (v.status !== undefined) update.status = v.status

  const { data: rfp, error } = await supabase
    .from('rfps')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()
  if (error) return apiError('Could not update the RFP.', 'update_failed', 500)

  const statusChanged = v.status !== undefined && v.status !== before.status
  await logActivity({
    actor: claims,
    entityType: 'rfp',
    entityId: rfp.id,
    action: statusChanged
      ? rfp.status === 'archived'
        ? 'rfp.archived'
        : 'rfp.status_changed'
      : 'rfp.edited',
    description: statusChanged
      ? `RFP "${rfp.title}" moved to ${RFP_STATUS[rfp.status].label}`
      : `RFP "${rfp.title}" edited`,
    before,
    after: rfp,
  })

  return NextResponse.json({ rfp })
}

/** DELETE /api/rfps/[id] (PM) — soft delete (is_deleted = true). */
export async function DELETE(_request: Request, { params }: Params) {
  const { supabase, claims } = await getRequestAuth()
  if (!claims) return unauthorized()
  if (claims.role !== 'procurement_manager') return forbidden()

  const { data: rfp, error } = await supabase
    .from('rfps')
    .update({ is_deleted: true })
    .eq('id', params.id)
    .eq('is_deleted', false)
    .select('id, title')
    .maybeSingle()
  if (error) return apiError('Could not delete the RFP.', 'update_failed', 500)
  if (!rfp) return apiError('RFP not found.', 'not_found', 404)

  await logActivity({
    actor: claims,
    entityType: 'rfp',
    entityId: rfp.id,
    action: 'rfp.deleted',
    description: `RFP "${rfp.title}" deleted`,
  })
  return NextResponse.json({ ok: true })
}
