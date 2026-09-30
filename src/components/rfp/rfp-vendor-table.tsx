'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { DataTable } from '@/components/shared/data-table'
import { VendorStatusBadge } from '@/components/shared/status-badge'
import type { RfpVendorRow } from '@/lib/queries/rfps'
import { cn } from '@/lib/utils'

function scoreTone(score: number) {
  if (score >= 7) return 'text-green-800'
  if (score >= 4) return 'text-amber-800'
  return 'text-red-800'
}

/** Vendor list for one RFP (App Flow §4, right panel). */
export function RfpVendorTable({
  rfpId,
  vendors,
  loading,
}: {
  rfpId: string
  vendors: RfpVendorRow[]
  loading: boolean
}) {
  const router = useRouter()
  const vendorHref = (row: RfpVendorRow) =>
    `/pipeline/rfp/${rfpId}/vendor/${row.vendor?.id ?? ''}`

  const columns: ColumnDef<RfpVendorRow, unknown>[] = [
    {
      id: 'vendor',
      header: 'Vendor Name',
      accessorFn: (r) => r.vendor?.company_name ?? '',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-foreground">
            {row.original.vendor?.company_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.vendor?.email}
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (r) => r.status,
      cell: ({ row }) => <VendorStatusBadge status={row.original.status} />,
    },
    {
      id: 'documents',
      header: 'Documents',
      accessorFn: (r) => r.document_count,
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm">
          <FileText
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          {row.original.document_count}
        </span>
      ),
    },
    {
      id: 'flags',
      header: 'Compliance Flags',
      accessorFn: (r) => r.flag_count,
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm">
          <AlertTriangle
            className={cn(
              'size-3.5',
              row.original.flag_count
                ? 'text-destructive'
                : 'text-muted-foreground'
            )}
            aria-hidden="true"
          />
          {row.original.flag_count}
        </span>
      ),
    },
    {
      id: 'score',
      header: 'Score',
      accessorFn: (r) => r.score ?? -1,
      cell: ({ row }) =>
        row.original.score === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className={cn('font-medium', scoreTone(row.original.score))}>
            {row.original.score.toFixed(1)}
          </span>
        ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <Link
          href={vendorHref(row.original)}
          className="whitespace-nowrap text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View Details
        </Link>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={vendors}
      loading={loading}
      getRowId={(r) => r.entry_id}
      onRowClick={(r) => router.push(vendorHref(r))}
    />
  )
}
