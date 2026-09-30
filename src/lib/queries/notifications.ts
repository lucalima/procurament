import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

export type NotificationItem = Pick<
  Tables<'notifications'>,
  'id' | 'type' | 'title' | 'body' | 'entity_type' | 'entity_id' | 'created_at'
>

interface NotificationsResponse {
  notifications: NotificationItem[]
  unreadCount: number
}

export const notificationKeys = { unread: ['notifications', 'unread'] as const }

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return (await res.json()) as T
}

/** Unread notifications, polled every 30s (Implementation Plan Phase 9). */
export function useUnreadNotifications() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => fetchJson<NotificationsResponse>('/api/notifications'),
    refetchInterval: 30_000,
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      fetchJson('/api/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread }),
  })
}

/** Marks one notification read when it is clicked (RLS limits this to the recipient). */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await createClient()
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread }),
  })
}

/** Deep link for a notification's entity. */
export function notificationHref(
  n: Pick<NotificationItem, 'entity_type' | 'entity_id'>
) {
  if (!n.entity_id) return '/activity'
  switch (n.entity_type) {
    case 'rfp':
      return `/pipeline/rfp/${n.entity_id}`
    case 'contract':
      return `/contracts/${n.entity_id}`
    case 'approval_request':
      return `/approvals/${n.entity_id}`
    case 'requirement':
      return `/requirements/${n.entity_id}`
    default:
      return '/activity'
  }
}
