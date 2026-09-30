import { PmDashboard } from '@/components/dashboard/pm-dashboard'
import { PageContainer, PageHeader } from '@/components/layout/page-header'
import { readAppClaims, type InternalRole } from '@/lib/auth/claims'
import { createClient } from '@/lib/supabase/server'

const DESCRIPTIONS: Record<InternalRole, string> = {
  procurement_manager:
    'Your procurement pipeline, pending approvals and contracts at a glance.',
  department_head: 'Track your requirements and review vendor evaluations.',
  finance_approver: 'Vendor selections waiting for your approval.',
}

// The DH and FA dashboards are built in Phase 8.
export default async function DashboardPage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = readAppClaims(data?.claims)
  const role = claims?.role === 'vendor' ? null : claims?.role

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={role ? DESCRIPTIONS[role] : undefined}
      />
      {role === 'procurement_manager' && <PmDashboard />}
    </PageContainer>
  )
}
