'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { daysUntil, formatDate } from '@/lib/format'
import type { RfpListItem } from '@/lib/queries/rfps'
import { cn } from '@/lib/utils'

/** Kanban card (Content Guidelines §7.3). Click opens the RFP; drag moves it. */
export function RfpCard({ rfp }: { rfp: RfpListItem }) {
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rfp.id, data: { status: rfp.status } })

  const pastDeadline =
    rfp.submission_deadline !== null && daysUntil(rfp.submission_deadline) < 0

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`${rfp.title}, ${rfp.department}. Press Enter to open, Space to move.`}
      onClick={() => router.push(`/pipeline/rfp/${rfp.id}`)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e)
        if (e.key === 'Enter') router.push(`/pipeline/rfp/${rfp.id}`)
      }}
      className={cn(
        'cursor-pointer rounded border border-border bg-card p-4 shadow-sm transition-all duration-150 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isDragging && 'rotate-1 scale-[1.02] opacity-50 shadow-lg'
      )}
    >
      <p className="text-sm font-medium text-foreground">{rfp.title}</p>
      <span className="mt-1 inline-block rounded-sm bg-accent px-2 py-0.5 text-xs text-accent-foreground">
        {rfp.department}
      </span>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {rfp.submission_deadline && (
          <span
            className={cn(
              'flex items-center gap-1',
              pastDeadline && 'text-destructive'
            )}
          >
            <Calendar className="size-3" aria-hidden="true" />
            {formatDate(rfp.submission_deadline)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="size-3" aria-hidden="true" />
          {rfp.vendor_count}
          <span className="sr-only"> vendors</span>
        </span>
      </div>
    </div>
  )
}
