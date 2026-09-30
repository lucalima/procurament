'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { formatDistanceToNow } from 'date-fns'
import { CheckSquare, FileText, Kanban, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { StatCard } from '@/components/dashboard/stat-card'
import { DataTable } from '@/components/shared/data-table'
import { RfpStatusBadge } from '@/components/shared/status-badge'
import { daysSince, daysUntil, formatDate } from '@/lib/format'
import { usePmDashboard } from '@/lib/queries/dashboard'
import { cn } from '@/lib/utils'

type Dashboard = NonNullable<ReturnType<typeof usePmDashboard>['data']>
type SnapshotRow = Dashboard['snapshot'][number]
type RenewalRow = Dashboard['renewals'][number]
type ActivityRow = Dashboard['activity'][number]

function Panel({
  title,
  link,
  children,
}: {
  title: string
  link?: { href: string; label: string }
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-foreground">{title}</h2>
        {link && (
          <Link
            href={link.href}
            className="text-sm text-primary hover:underline"
          >
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

const snapshotColumns: ColumnDef<SnapshotRow, unknown>[] = [
  { id: 'title', header: 'RFP', accessorKey: 'title', enableSorting: false },
  {
    id: 'department',
    header: 'Department',
    accessorKey: 'department',
    enableSorting: false,
  },
  {
    id: 'stage',
    header: 'Stage',
    enableSorting: false,
    cell: ({ row }) => <RfpStatusBadge status={row.original.status} />,
  },
  {
    id: 'vendors',
    header: 'Vendors',
    accessorKey: 'vendor_count',
    enableSorting: false,
  },
  {
    id: 'activity',
    header: 'Last Activity',
    enableSorting: false,
    cell: ({ row }) => {
      const days = daysSince(row.original.updated_at)
      return (
        <span className="text-sm text-muted-foreground">
          {days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} ago`}
        </span>
      )
    },
  },
]

const renewalColumns: ColumnDef<RenewalRow, unknown>[] = [
  {
    id: 'contract',
    header: 'Contract',
    accessorKey: 'title',
    enableSorting: false,
  },
  {
    id: 'vendor',
    header: 'Vendor',
    enableSorting: false,
    accessorFn: (r) => r.vendor_accounts?.company_name ?? '—',
  },
  {
    id: 'expiry',
    header: 'Expiry Date',
    enableSorting: false,
    accessorFn: (r) => formatDate(r.end_date),
  },
  {
    id: 'remaining',
    header: 'Days Remaining',
    enableSorting: false,
    cell: ({ row }) => {
      const days = daysUntil(row.original.end_date)
      // App Flow §4: red < 30, amber < 60, green < 90
      const tone =
        days < 30
          ? 'text-red-800'
          : days < 60
            ? 'text-amber-800'
            : 'text-green-800'
      return <span className={cn('text-sm font-medium', tone)}>{days}</span>
    },
  },
  {
    id: 'action',
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    meta: { align: 'right' },
    cell: ({ row }) => (
      <Link
        href={`/contracts/${row.original.id}`}
        className="text-sm text-primary hover:underline"
      >
        View contract
      </Link>
    ),
  },
]

const activityColumns: ColumnDef<ActivityRow, unknown>[] = [
  {
    id: 'event',
    header: 'Event',
    accessorKey: 'description',
    enableSorting: false,
  },
  {
    id: 'when',
    header: 'When',
    enableSorting: false,
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span
        className="text-xs text-muted-foreground"
        title={new Date(row.original.created_at).toLocaleString()}
      >
        {formatDistanceToNow(new Date(row.original.created_at), {
          addSuffix: true,
        })}
      </span>
    ),
  },
]

/** Procurement Manager dashboard (App Flow §4 "PM Dashboard"). */
export function PmDashboard() {
  const router = useRouter()
  const { data, isLoading } = usePmDashboard()

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          label="Active RFPs"
          icon={Kanban}
          stat={data?.stats.activeRfps}
          href="/pipeline"
          loading={isLoading}
        />
        <StatCard
          label="Vendors Under Evaluation"
          icon={Users}
          stat={data?.stats.vendorsUnderEvaluation}
          loading={isLoading}
        />
        <StatCard
          label="Pending Approvals"
          icon={CheckSquare}
          stat={data?.stats.pendingApprovals}
          loading={isLoading}
        />
        <StatCard
          label="Contracts Expiring Soon"
          icon={FileText}
          stat={data?.stats.contractsExpiringSoon}
          href="/contracts"
          loading={isLoading}
        />
      </div>

      <Panel
        title="Pipeline Snapshot"
        link={{ href: '/pipeline', label: 'View all' }}
      >
        <DataTable
          columns={snapshotColumns}
          data={data?.snapshot ?? []}
          loading={isLoading}
          getRowId={(r) => r.id}
          onRowClick={(r) => router.push(`/pipeline/rfp/${r.id}`)}
        />
      </Panel>

      <div className="grid grid-cols-2 gap-8">
        <Panel title="Renewal Alerts">
          <DataTable
            columns={renewalColumns}
            data={data?.renewals ?? []}
            loading={isLoading}
            getRowId={(r) => r.id}
          />
        </Panel>
        <Panel
          title="Recent Activity"
          link={{ href: '/activity', label: 'View all activity' }}
        >
          <DataTable
            columns={activityColumns}
            data={data?.activity ?? []}
            loading={isLoading}
            getRowId={(r) => r.id}
          />
        </Panel>
      </div>
    </div>
  )
}
