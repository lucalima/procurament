import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { RfpDetailView } from '@/components/rfp/rfp-detail-view'
import { createClient } from '@/lib/supabase/server'

type Props = { params: { id: string } }

async function getRfpTitle(id: string) {
  const { data } = await createClient()
    .from('rfps')
    .select('title')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle()
  return data?.title ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const title = await getRfpTitle(params.id)
  return { title: `${title ?? 'RFP'} · ProcureMaster` }
}

export default async function RfpDetailPage({ params }: Props) {
  const title = await getRfpTitle(params.id)
  if (!title) notFound()

  return (
    <>
      <Breadcrumb
        items={[{ label: 'Pipeline', href: '/pipeline' }, { label: title }]}
      />
      <div className="px-8 py-8">
        <RfpDetailView rfpId={params.id} />
      </div>
    </>
  )
}
