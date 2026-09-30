import { cn } from '@/lib/utils'
import type { Enums } from '@/types/database'

/** Soft filled status colours (Content Guidelines §2.3). */
const TONES = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-slate-100 text-slate-700',
  ai: 'bg-violet-100 text-violet-800',
} as const

export type BadgeTone = keyof typeof TONES

/** Small, non-interactive status badge (Content Guidelines §6.3). */
export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: BadgeTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

type RfpStatus = Enums<'rfp_status'>

export const RFP_STATUS: Record<RfpStatus, { label: string; tone: BadgeTone }> =
  {
    requirements_received: { label: 'Requirements Received', tone: 'neutral' },
    rfp_created: { label: 'RFP Created', tone: 'neutral' },
    vendors_invited: { label: 'Vendors Invited', tone: 'info' },
    submissions_in: { label: 'Submissions In', tone: 'info' },
    under_evaluation: { label: 'Under Evaluation', tone: 'info' },
    shortlisted: { label: 'Shortlisted', tone: 'warning' },
    approval_pending: { label: 'Approval Pending', tone: 'warning' },
    contracted: { label: 'Contracted', tone: 'success' },
    archived: { label: 'Archived', tone: 'neutral' },
  }

export const RFP_STATUS_ORDER = Object.keys(RFP_STATUS) as RfpStatus[]

export function RfpStatusBadge({ status }: { status: RfpStatus }) {
  const { label, tone } = RFP_STATUS[status]
  return <StatusBadge tone={tone}>{label}</StatusBadge>
}

type VendorStatus = Enums<'vendor_pipeline_status'>

export const VENDOR_STATUS: Record<
  VendorStatus,
  { label: string; tone: BadgeTone }
> = {
  invited: { label: 'Invited', tone: 'neutral' },
  submitted: { label: 'Submitted', tone: 'info' },
  under_review: { label: 'Under Review', tone: 'info' },
  shortlisted: { label: 'Shortlisted', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  not_selected: { label: 'Not Selected', tone: 'neutral' },
  contracted: { label: 'Contracted', tone: 'success' },
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  const { label, tone } = VENDOR_STATUS[status]
  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
