import { SignOutButton } from '@/components/auth/sign-out-button'
import { readAppClaims } from '@/lib/auth/claims'
import { createClient } from '@/lib/supabase/server'

// Placeholder until Phase 6 builds the vendor portal.
export default async function VendorHomePage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = readAppClaims(data?.claims)

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl text-foreground">
            Vendor Portal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {claims?.email}
          </p>
        </div>
        <SignOutButton />
      </div>
      <div className="mb-8 mt-6 border-b border-border" />
    </main>
  )
}
