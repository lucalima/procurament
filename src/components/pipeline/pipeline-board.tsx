'use client'

import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PipelineColumn } from '@/components/pipeline/pipeline-column'
import {
  applyPipelineFilters,
  NO_FILTERS,
  PipelineFilters,
  type PipelineFilterState,
} from '@/components/pipeline/pipeline-filters'
import { RfpFormDialog } from '@/components/rfp/rfp-form-dialog'
import { RFP_STATUS, RFP_STATUS_ORDER } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMoveRfp, useRfps, type RfpStatus } from '@/lib/queries/rfps'

/** Horizontal kanban of RFPs by stage (App Flow §4, Content Guidelines §7). */
export function PipelineBoard() {
  const { data: rfps, isLoading } = useRfps()
  const move = useMoveRfp()
  const [filters, setFilters] = useState<PipelineFilterState>(NO_FILTERS)
  const [createOpen, setCreateOpen] = useState(false)

  const sensors = useSensors(
    // A short drag distance keeps plain clicks opening the RFP.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const columns = useMemo(() => {
    const visible = applyPipelineFilters(rfps ?? [], filters)
    return RFP_STATUS_ORDER.map((status) => ({
      status,
      rfps: visible.filter((r) => r.status === status),
    }))
  }, [rfps, filters])

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const from = active.data.current?.status as RfpStatus | undefined
    // Dropped on a column or on another card in that column.
    const to = (over.data.current?.status ??
      over.data.current?.sortable?.containerId) as RfpStatus | undefined
    if (!to || !from || to === from) return
    const title = rfps?.find((r) => r.id === active.id)?.title ?? 'RFP'
    move.mutate(
      { id: String(active.id), status: to },
      {
        onSuccess: () =>
          toast.success(`${title} moved to ${RFP_STATUS[to].label}`),
        onError: () =>
          toast.error(`Could not move ${title}. Please try again.`),
      }
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <PipelineFilters value={filters} onChange={setFilters} />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New RFP
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto rounded bg-muted/30 p-3 pb-4">
          {isLoading
            ? RFP_STATUS_ORDER.map((status) => (
                <div
                  key={status}
                  className="flex min-w-[280px] flex-col gap-2 rounded bg-muted/50 p-3"
                >
                  <Skeleton className="mb-2 h-4 w-32 bg-muted" />
                  <Skeleton className="h-24 w-full bg-muted" />
                  <Skeleton className="h-24 w-full bg-muted" />
                </div>
              ))
            : columns.map((col) => (
                <PipelineColumn
                  key={col.status}
                  status={col.status}
                  rfps={col.rfps}
                />
              ))}
        </div>
      </DndContext>

      <RfpFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
