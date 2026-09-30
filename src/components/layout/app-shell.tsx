'use client'

import { Suspense, type ReactNode } from 'react'

import { NoticeToast } from '@/components/layout/notice-toast'
import type { ShellUser } from '@/components/layout/shell-user'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'

/** Internal app shell: sidebar + (sticky top bar over content) (Content Guidelines §5.1). */
export function AppShell({
  user,
  children,
}: {
  user: ShellUser
  children: ReactNode
}) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)

  return (
    <div
      className={cn(
        'grid min-h-screen bg-background',
        collapsed ? 'grid-cols-[64px_1fr]' : 'grid-cols-[256px_1fr]'
      )}
    >
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-col">
        <TopBar user={user} />
        <main className="flex-1">{children}</main>
      </div>
      <Suspense fallback={null}>
        <NoticeToast />
      </Suspense>
    </div>
  )
}
