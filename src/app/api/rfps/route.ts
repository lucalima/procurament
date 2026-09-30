import { NextResponse, type NextRequest } from 'next/server'

import { logActivity } from '@/lib/activity'
import { getRequestAuth } from '@/lib/api/auth'
import {
  apiError,
  forbidden,
  unauthorized,
  validationError,
} from '@/lib/api/responses'
import { rfpSchema, rfpStatusSchema } from '@/lib/schemas/rfp'

/**
 * GET /api/rfps (PM) — RFPs for the org with vendor counts. Optional filters:
 * status, department, from/to (created date, yyyy-mm-dd) and q (full-text).
 */
export async function GET(request: NextRequest) {
  const { supabase, claims } = await getRequestAuth()
  if (!claims) return unauthorized()
  if (claims.role !== 'procurement_manager') return forbidden()

  const params = request.nextUrl.searchParams
  let query = supabase
    .from('rfps')
    .select(
      'id, title, description, department, budget_min, budget_max, submission_deadline, status, requirement_id, created_at, updated_at, rfp_vendor_entries(count)'
    )
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  const status = rfpStatusSchema.safeParse(params.get('status'))
  if (status.success) query = query.eq('status', status.data)
  const department = params.get('department')
  if (department) query = query.eq('department', department)
  const from = params.get('from')
  if (from) query = query.gte('created_at', from)
  const to = params.get('to')
  if (to) query = query.lte('created_at', `${to}T23:59:59.999Z`)
  const q = params.get('q')?.trim()
  if (q) {
    query = query.textSearch('search_vector', q, {
      type: 'plain',
      config: 'english',
    })
  }

  const { data, error } = await query
  if (error) return apiError('Could not load RFPs.', 'query_failed', 500)

  const rfps = data.map(({ rfp_vendor_entries, ...rfp }) => ({
    ...rfp,
    vendor_count: rfp_vendor_entries[0]?.count ?? 0,
  }))
  return NextResponse.json({ rfps })
}

/** POST /api/rfps (PM) — creates an RFP; a trigger adds its evaluation record. */
export async function POST(request: Request) {
  const { supabase, claims } = await getRequestAuth()
  if (!claims) return unauthorized()
  if (claims.role !== 'procurement_manager') return forbidden()

  const parsed = rfpSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error)
  const v = parsed.data

  const { data: rfp, error } = await supabase
    .from('rfps')
    .insert({
      org_id: claims.orgId,
      created_by: claims.userId,
      title: v.title,
      description: v.description,
      department: v.department,
      budget_min: v.budgetMin,
      budget_max: v.budgetMax,
      submission_deadline: v.submissionDeadline,
      status: 'rfp_created',
    })
    .select()
    .single()

  if (error) return apiError('Could not create the RFP.', 'insert_failed', 500)

  await logActivity({
    actor: claims,
    entityType: 'rfp',
    entityId: rfp.id,
    action: 'rfp.created',
    description: `RFP "${rfp.title}" created`,
    after: rfp,
  })

  return NextResponse.json(
    { rfp: { ...rfp, vendor_count: 0 } },
    { status: 201 }
  )
}
