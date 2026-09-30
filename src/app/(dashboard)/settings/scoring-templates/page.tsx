import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer, PageHeader } from '@/components/layout/page-header'

// Placeholder: built in a later phase.
export default function ScoringTemplatesPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Settings', href: '/settings/organisation' },
          { label: 'Scoring Templates' },
        ]}
      />
      <PageContainer>
        <PageHeader
          title="Scoring Templates"
          description="Reusable scoring criteria for evaluations."
        />
      </PageContainer>
    </>
  )
}
