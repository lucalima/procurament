import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { readAppClaims } from '@/lib/auth/claims'
import { CURRENCIES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Set up your workspace · ProcureMaster',
}

type Currency = (typeof CURRENCIES)[number]

function toStep(value: string | undefined): 1 | 2 | 3 {
  return value === '2' ? 2 : value === '3' ? 3 : 1
}

/** First-login wizard. The middleware limits it to PMs who have not finished it. */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { step?: string; invited?: string }
}) {
  const supabase = createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = readAppClaims(data?.claims)
  if (!claims) redirect('/login')

  const { data: org } = await supabase
    .from('organisations')
    .select('name, currency')
    .eq('id', claims.orgId)
    .single()

  const currency = (CURRENCIES as readonly string[]).includes(
    org?.currency ?? ''
  )
    ? (org?.currency as Currency)
    : 'USD'

  return (
    <OnboardingWizard
      orgId={claims.orgId}
      org={{ name: org?.name ?? '', currency }}
      initialStep={toStep(searchParams.step)}
      initialInvited={Number(searchParams.invited) || 0}
    />
  )
}
