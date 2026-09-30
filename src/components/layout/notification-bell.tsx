'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  FileText,
  Sparkles,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  notificationHref,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUnreadNotifications,
  type NotificationItem,
} from '@/lib/queries/notifications'
import { useNotificationStore } from '@/stores/useNotificationStore'

const TYPE_ICONS: Record<NotificationItem['type'], LucideIcon> = {
  vendor_submitted: Upload,
  scoring_complete: Sparkles,
  extraction_failed: AlertTriangle,
  approval_requested: CheckSquare,
  approval_sla_warning: AlertTriangle,
  approval_decided: CheckCircle2,
  renewal_alert: FileText,
  vendor_status_updated: CheckCircle2,
  requirement_submitted: ClipboardList,
  evaluation_ready: Sparkles,
}

/** Bell with unread badge and dropdown of the 10 latest unread (App Flow §2.3). */
export function NotificationBell() {
  const router = useRouter()
  const { data } = useUnreadNotifications()
  const markAll = useMarkAllNotificationsRead()
  const markOne = useMarkNotificationRead()
  const { dropdownOpen, setDropdownOpen, unreadCount, setUnreadCount } =
    useNotificationStore()

  useEffect(() => {
    setUnreadCount(data?.unreadCount ?? 0)
  }, [data?.unreadCount, setUnreadCount])

  const notifications = data?.notifications ?? []

  return (
    <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications, ${unreadCount} unread`}
          title="Notifications"
        >
          <Bell className="!size-5" />
          <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 rounded p-0 shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={notifications.length === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Mark all as read
          </Button>
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type]
            return (
              <li key={n.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-accent/60"
                  onClick={() => {
                    markOne.mutate(n.id)
                    setDropdownOpen(false)
                    router.push(notificationHref(n))
                  }}
                >
                  <Icon
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-foreground">
                      {n.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {n.body}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </span>
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                    aria-label="Unread"
                  />
                </button>
              </li>
            )
          })}
        </ul>
        <div className="border-t border-border px-4 py-3">
          <Link
            href="/activity"
            className="text-sm text-primary hover:underline"
            onClick={() => setDropdownOpen(false)}
          >
            View all activity
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
