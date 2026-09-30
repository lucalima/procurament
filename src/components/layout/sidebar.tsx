'use client'

import { Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { navItemsFor } from '@/components/layout/nav-config'
import type { ShellUser } from '@/components/layout/shell-user'
import { UserAvatar } from '@/components/layout/user-avatar'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Internal app sidebar (Content Guidelines §5.2, App Flow §2.1). */
export function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname()
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const items = navItemsFor(user.role)
  const showSettings = user.role === 'procurement_manager'

  const itemClass = (active: boolean) =>
    cn(
      'flex items-center gap-2 border-l-2 py-2.5 text-sm transition-colors duration-100',
      collapsed ? 'justify-center px-0' : 'px-3',
      active
        ? 'border-primary bg-accent font-medium text-primary'
        : 'border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground'
    )

  return (
    <aside
      className="sticky top-0 flex h-screen flex-col border-r border-border bg-card"
      aria-label="Main navigation"
    >
      <Link
        href="/dashboard"
        className={cn(
          'flex h-14 shrink-0 items-center gap-2 bg-gradient-to-br from-blue-700 to-violet-700',
          collapsed ? 'justify-center' : 'px-4'
        )}
      >
        <span className="font-heading text-lg text-primary-foreground">PM</span>
        {!collapsed && (
          <span className="font-heading text-lg text-primary-foreground">
            ProcureMaster
          </span>
        )}
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto py-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={itemClass(active)}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className={collapsed ? 'sr-only' : undefined}>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border py-4">
        {showSettings && (
          <Link
            href="/settings/organisation"
            className={itemClass(isActive(pathname, '/settings'))}
            aria-current={isActive(pathname, '/settings') ? 'page' : undefined}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="size-5 shrink-0" aria-hidden="true" />
            <span className={collapsed ? 'sr-only' : undefined}>Settings</span>
          </Link>
        )}
        <div
          className={cn(
            'mt-3 flex items-center gap-2',
            collapsed ? 'justify-center' : 'px-3'
          )}
        >
          <UserAvatar name={user.fullName} src={user.avatarUrl} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
