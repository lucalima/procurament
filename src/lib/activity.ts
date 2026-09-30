import type { AppClaims } from '@/lib/auth/claims'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Enums, Json } from '@/types/database'

/** Row snapshot as JSON, minus generated full-text columns that add noise. */
function toStateJson(row: unknown): Json | null {
  if (row === null || row === undefined) return null
  return JSON.parse(
    JSON.stringify(row, (key, value: unknown) =>
      key === 'search_vector' ? undefined : value
    )
  ) as Json
}

/**
 * Appends one entry to the activity_log audit trail (Backend Schema §2.17).
 * activity_log has no client write policy, so this uses the service role and
 * must only run on the server. Failures are logged, never thrown: an audit
 * write must not undo the action it records.
 */
export async function logActivity(entry: {
  actor: AppClaims | null
  entityType: Enums<'activity_entity'>
  entityId: string
  action: string
  description: string
  before?: unknown
  after?: unknown
  metadata?: Json | null
  orgId?: string
}) {
  const orgId = entry.orgId ?? entry.actor?.orgId
  if (!orgId) return

  const { error } = await createAdminClient()
    .from('activity_log')
    .insert({
      org_id: orgId,
      actor_id: entry.actor?.userId ?? null,
      actor_type: entry.actor
        ? entry.actor.userType === 'vendor'
          ? 'vendor'
          : 'profile'
        : 'system',
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      action: entry.action,
      description: entry.description,
      before_state: toStateJson(entry.before),
      after_state: toStateJson(entry.after),
      metadata: entry.metadata ?? null,
    })

  if (error) {
    // eslint-disable-next-line no-console
    console.error('logActivity failed', entry.action, error.message)
  }
}
