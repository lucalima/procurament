import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { readAppClaims } from '@/lib/auth/claims'
import { createClient } from '@/lib/supabase/server'

/** Shell for every internal page (PM, DH, FA). The middleware guards access. */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = readAppClaims(data?.claims)
  if (!claims || claims.role === 'vendor') redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', claims.userId)
    .single()

  return (
    <AppShell
      user={{
        fullName: profile?.full_name ?? claims.email ?? 'User',
        email: claims.email ?? '',
        avatarUrl: profile?.avatar_url ?? null,
        role: claims.role,
      }}
    >
      {children}
    </AppShell>
  )
}
