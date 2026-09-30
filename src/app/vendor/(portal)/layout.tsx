import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { VendorShell } from '@/components/layout/vendor-shell'
import { readAppClaims } from '@/lib/auth/claims'
import { createClient } from '@/lib/supabase/server'

/**
 * Vendor portal shell for signed-in vendors. The public invite pages
 * (/vendor/invite/*) sit outside this route group, so they get no shell.
 */
export default async function VendorPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = readAppClaims(data?.claims)
  if (!claims || claims.userType !== 'vendor') redirect('/login')

  // RLS returns only this vendor's own account rows.
  const { data: account } = await supabase
    .from('vendor_accounts')
    .select('company_name, contact_name')
    .eq('auth_user_id', claims.userId)
    .eq('org_id', claims.orgId)
    .limit(1)
    .maybeSingle()

  return (
    <VendorShell
      companyName={account?.company_name ?? ''}
      contactName={account?.contact_name ?? claims.email ?? 'Vendor'}
      email={claims.email ?? ''}
    >
      {children}
    </VendorShell>
  )
}
