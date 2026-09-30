'use client'

import { Archive, Pencil, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/rfp/confirm-dialog'
import { InviteVendorDialog } from '@/components/rfp/invite-vendor-dialog'
import { RfpFormDialog } from '@/components/rfp/rfp-form-dialog'
import { RfpVendorTable } from '@/components/rfp/rfp-vendor-table'
import { RfpStatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatBudgetRange, formatDate } from '@/lib/format'
import { useRfp, useUpdateRfp, type RfpDetail } from '@/lib/queries/rfps'

const LONG_DESCRIPTION = 280

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  )
}

/** Click-to-edit RFP title (App Flow §4: "editable inline on click"). */
function InlineTitle({ rfp }: { rfp: RfpDetail['rfp'] }) {
  const update = useUpdateRfp(rfp.id)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(rfp.title)

  const save = async () => {
    const title = value.trim()
    setEditing(false)
    if (!title || title === rfp.title) {
      setValue(rfp.title)
      return
    }
    try {
      await update.mutateAsync({ title })
      toast.success('RFP title updated')
    } catch {
      setValue(rfp.title)
      toast.error('Could not update the title. Please try again.')
    }
  }

  if (editing) {
    return (
      <Input
        autoFocus
        aria-label="RFP title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void save()
          if (e.key === 'Escape') {
            setValue(rfp.title)
            setEditing(false)
          }
        }}
        className="font-heading text-2xl"
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to edit the title"
      className="-mx-1 rounded px-1 text-left font-heading text-2xl text-foreground hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {rfp.title}
    </button>
  )
}

/** RFP detail split view: details left (35%), vendor list right (65%) (App Flow §4). */
export function RfpDetailView({ rfpId }: { rfpId: string }) {
  const router = useRouter()
  const { data, isLoading } = useRfp(rfpId)
  const update = useUpdateRfp(rfpId)
  const [editOpen, setEditOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-[35fr_65fr] gap-8">
        <Skeleton className="h-96 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    )
  }

  const { rfp, evaluation, vendors } = data
  const hasSubmissions = vendors.some(
    (v) => v.submission_status && v.submission_status !== 'in_progress'
  )
  const scored =
    evaluation?.status === 'scored' || evaluation?.status === 'report_generated'
  const reportReady = evaluation?.status === 'report_generated'
  const hasShortlist = vendors.some((v) => v.is_shortlisted)
  const archived = rfp.status === 'archived'
  const longDescription = rfp.description.length > LONG_DESCRIPTION

  const archive = async () => {
    try {
      await update.mutateAsync({ status: 'archived' })
      setArchiveOpen(false)
      toast.success(`${rfp.title} archived`)
      router.push('/pipeline')
    } catch {
      toast.error('Could not archive the RFP. Please try again.')
    }
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-[35fr_65fr] items-start gap-8">
        <aside className="space-y-6 rounded border border-border bg-card p-6 shadow-sm">
          <div className="space-y-3">
            <InlineTitle key={rfp.title} rfp={rfp} />
            <RfpStatusBadge status={rfp.status} />
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <Detail label="Department" value={rfp.department} />
            <Detail
              label="Submission deadline"
              value={formatDate(rfp.submission_deadline)}
            />
            <div className="col-span-2">
              <Detail
                label="Budget range"
                value={formatBudgetRange(rfp.budget_min, rfp.budget_max)}
              />
            </div>
          </dl>
          <div>
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="mt-0.5 max-w-prose whitespace-pre-line text-sm text-foreground">
              {longDescription && !expanded
                ? `${rfp.description.slice(0, LONG_DESCRIPTION)}…`
                : rfp.description}
            </p>
            {longDescription && (
              <Button
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => setExpanded((e) => !e)}
              >
                {expanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6">
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              disabled={archived}
            >
              <Pencil />
              Edit RFP
            </Button>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(true)}
              disabled={archived}
            >
              <UserPlus />
              Invite Vendors
            </Button>
            {/* Evaluation, report and approval actions are wired up in Phases 7–8. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={hasSubmissions ? -1 : 0} className="flex">
                  <Button className="flex-1" disabled>
                    Start Evaluation
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {hasSubmissions
                  ? 'AI evaluation becomes available in a later build phase.'
                  : 'Available once at least one vendor has submitted.'}
              </TooltipContent>
            </Tooltip>
            {scored && <Button variant="outline">Generate Report</Button>}
            {reportReady && hasShortlist && (
              <Button>Submit for Approval</Button>
            )}
            {!archived && (
              <Button variant="ghost" onClick={() => setArchiveOpen(true)}>
                <Archive />
                Archive RFP
              </Button>
            )}
          </div>
        </aside>

        <section aria-labelledby="vendors-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              id="vendors-heading"
              className="font-heading text-2xl text-foreground"
            >
              Vendors
            </h2>
            <Button onClick={() => setInviteOpen(true)} disabled={archived}>
              <UserPlus />
              Invite Vendor
            </Button>
          </div>
          <RfpVendorTable rfpId={rfp.id} vendors={vendors} loading={false} />
        </section>
      </div>

      <RfpFormDialog open={editOpen} onOpenChange={setEditOpen} rfp={rfp} />
      <InviteVendorDialog
        rfpId={rfp.id}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive this RFP?"
        description="It moves to the Archived column. You can drag it back from the pipeline at any time."
        confirmLabel="Archive RFP"
        pending={update.isPending}
        onConfirm={archive}
      />
    </TooltipProvider>
  )
}
