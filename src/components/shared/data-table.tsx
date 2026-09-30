'use client'

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

/**
 * TanStack Table rendered into shadcn/ui Table (Tech Stack §8.1) with the
 * Content Guidelines §6.5 states: sortable headers, skeleton loading rows and
 * an empty row with headers kept (App Flow §10.3).
 */
export function DataTable<TData>({
  columns,
  data,
  loading = false,
  onRowClick,
  getRowId,
}: {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  loading?: boolean
  onRowClick?: (row: TData) => void
  getRowId?: (row: TData) => string
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(getRowId ? { getRowId } : {}),
  })

  return (
    <div className="overflow-hidden rounded border border-border shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const sortable = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                const content = header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      (
                        header.column.columnDef.meta as
                          | { align?: string }
                          | undefined
                      )?.align === 'right' && 'text-right'
                    )}
                    aria-sort={
                      sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                      >
                        {content}
                        {sorted === 'asc' ? (
                          <ArrowUp className="size-4" aria-hidden="true" />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="size-4" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      content
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => (
              <TableRow key={`skeleton-${i}`} className="min-h-[52px]">
                {columns.map((_, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4 w-full rounded bg-muted" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12" />
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn('min-h-[52px]', onRowClick && 'cursor-pointer')}
                onClick={
                  onRowClick ? () => onRowClick(row.original) : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      (
                        cell.column.columnDef.meta as
                          | { align?: string }
                          | undefined
                      )?.align === 'right' && 'text-right'
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
