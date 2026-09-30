import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { PipelineBoard } from '@/components/pipeline/pipeline-board'

export const metadata: Metadata = { title: 'Pipeline · ProcureMaster' }

// The board scrolls horizontally, so this page uses the full content width
// rather than PageContainer's max-w-7xl.
export default function PipelinePage() {
  return (
    <div className="px-8 py-8">
      <PageHeader
        title="Pipeline"
        description="Every procurement, by stage. Drag a card to move it to another stage."
      />
      <PipelineBoard />
    </div>
  )
}
