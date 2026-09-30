import { NextResponse } from 'next/server'

import { getRequestAuth } from '@/lib/api/auth'
import { apiError, unauthorized } from '@/lib/api/responses'

/**
 * GET /api/notifications — the current user's 10 most recent unread
 * notifications plus the total unread count (App Flow §2.3). RLS limits rows
 * to the recipient.
 */
export async function GET() {
  const { supabase, claims } = await getRequestAuth()
  if (!claims) return unauthorized()

  const { data, count, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, entity_type, entity_id, created_at', {
      count: 'exact',
    })
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return apiError('Could not load notifications.', 'query_failed', 500)
  }
  return NextResponse.json({ notifications: data, unreadCount: count ?? 0 })
}
