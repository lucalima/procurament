import type { ReactNode } from 'react'

import { UserMenu } from '@/components/layout/user-menu'

/**
 * Vendor portal shell: no sidebar. Top bar with logo, vendor company name and
 * an avatar menu containing Sign Out only (App Flow §7).
 */
export function VendorShell({
  companyName,
  contactName,
  email,
  children,
}: {
  companyName: string
  contactName: string
  email: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background px-8">
        <span className="flex items-center gap-2">
          <span className="font-heading text-lg text-primary">PM</span>
          <span className="font-heading text-lg text-foreground">
            ProcureMaster
          </span>
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {companyName}
          </span>
          <UserMenu name={contactName} email={email} variant="vendor" />
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
