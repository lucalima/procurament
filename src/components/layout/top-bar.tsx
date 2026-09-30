'use client'

import { PanelLeft } from 'lucide-react'

import { GlobalSearch } from '@/components/layout/global-search'
import { NotificationBell } from '@/components/layout/notification-bell'
import type { ShellUser } from '@/components/layout/shell-user'
import { UserMenu } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/useAppStore'

/** Sticky top bar: sidebar toggle, search, bell, avatar (Content Guidelines §5.3). */
export function TopBar({ user }: { user: ShellUser }) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background px-8">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <PanelLeft className="!size-5" />
      </Button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <UserMenu
          name={user.fullName}
          email={user.email}
          avatarUrl={user.avatarUrl}
        />
      </div>
    </header>
  )
}
