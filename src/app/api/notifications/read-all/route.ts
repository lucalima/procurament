import { NextResponse } from 'next/server'

import { getRequestAuth } from '@/lib/api/auth'
import { apiError, unauthorized } from '@/lib/api/responses'

/** PATCH /api/notifications/read-all — marks every unread notification read. */
export async function PATCH() {
  const { supabase, claims } = await getRequestAuth()
  if (!claims) return unauthorized()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', claims.userId)
    .eq('is_read', false)

  if (error) {
    return apiError('Could not update notifications.', 'update_failed', 500)
  }
  return NextResponse.json({ ok: true })
}
