import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer, PageHeader } from '@/components/layout/page-header'
import { VendorStatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Vendor · ProcureMaster' }

// The Notes tab is left out (user decision 2026-09-30). Tab contents are built
// in Phase 7.
const TABS = [
  { value: 'documents', label: 'Documents' },
  { value: 'scores', label: 'Scores' },
  { value: 'compliance', label: 'Compliance' },
] as const

export default async function VendorDetailPage({
  params,
}: {
  params: { id: string; vendorId: string }
}) {
  const supabase = createClient()
  const [{ data: rfp }, { data: entry }] = await Promise.all([
    supabase
      .from('rfps')
      .select('title')
      .eq('id', params.id)
      .eq('is_deleted', false)
      .maybeSingle(),
    supabase
      .from('rfp_vendor_entries')
      .select('status, vendor_accounts(company_name, email)')
      .eq('rfp_id', params.id)
      .eq('vendor_account_id', params.vendorId)
      .maybeSingle(),
  ])
  if (!rfp || !entry?.vendor_accounts) notFound()

  const vendorName = entry.vendor_accounts.company_name

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: rfp.title, href: `/pipeline/rfp/${params.id}` },
          { label: vendorName },
        ]}
      />
      <PageContainer>
        <PageHeader
          title={vendorName}
          description={entry.vendor_accounts.email}
          action={<VendorStatusBadge status={entry.status} />}
        />
        <Tabs defaultValue="documents">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} />
          ))}
        </Tabs>
      </PageContainer>
    </>
  )
}
