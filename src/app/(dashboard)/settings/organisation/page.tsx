import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer, PageHeader } from '@/components/layout/page-header'

// Placeholder: built in a later phase.
export default function OrganisationPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Settings', href: '/settings/organisation' },
          { label: 'Organisation' },
        ]}
      />
      <PageContainer>
        <PageHeader
          title="Organisation"
          description="Your organisation profile, logo and default currency."
        />
      </PageContainer>
    </>
  )
}
