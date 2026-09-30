'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { RfpCard } from '@/components/pipeline/rfp-card'
import { RFP_STATUS } from '@/components/shared/status-badge'
import type { RfpListItem, RfpStatus } from '@/lib/queries/rfps'
import { cn } from '@/lib/utils'

/** One pipeline stage (Content Guidelines §7.2). */
export function PipelineColumn({
  status,
  rfps,
}: {
  status: RfpStatus
  rfps: RfpListItem[]
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${status}`,
    data: { status },
  })
  const label = RFP_STATUS[status].label

  return (
    <section
      aria-label={`${label}, ${rfps.length} RFPs`}
      className={cn(
        'flex min-w-[280px] flex-col gap-2 rounded bg-muted/50 p-3 transition-colors duration-150',
        isOver && 'bg-accent/60'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h2>
        <span className="rounded-full bg-border px-2 py-0.5 text-xs font-medium text-foreground">
          {rfps.length}
        </span>
      </div>
      <SortableContext
        id={status}
        items={rfps.map((r) => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex min-h-[120px] flex-col gap-2">
          {rfps.map((rfp) => (
            <RfpCard key={rfp.id} rfp={rfp} />
          ))}
        </div>
      </SortableContext>
    </section>
  )
}
