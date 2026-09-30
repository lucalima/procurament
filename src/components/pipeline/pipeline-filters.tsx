'use client'

import { Filter, Search } from 'lucide-react'

import { RFP_STATUS, RFP_STATUS_ORDER } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEPARTMENTS } from '@/lib/constants'
import type { RfpListItem, RfpStatus } from '@/lib/queries/rfps'

export interface PipelineFilterState {
  search: string
  department: string
  status: RfpStatus | ''
  from: string
  to: string
}

export const NO_FILTERS: PipelineFilterState = {
  search: '',
  department: '',
  status: '',
  from: '',
  to: '',
}

const ALL = '__all__'

/** Applies the pipeline search and filter panel to the RFP list, in the browser. */
export function applyPipelineFilters(
  rfps: RfpListItem[],
  f: PipelineFilterState
) {
  const q = f.search.trim().toLowerCase()
  return rfps.filter((r) => {
    if (
      q &&
      !`${r.title} ${r.department} ${r.description}`.toLowerCase().includes(q)
    ) {
      return false
    }
    if (f.department && r.department !== f.department) return false
    if (f.status && r.status !== f.status) return false
    const created = r.created_at.slice(0, 10)
    if (f.from && created < f.from) return false
    if (f.to && created > f.to) return false
    return true
  })
}

/** Search input + filter panel (department, status, date range) (App Flow §4). */
export function PipelineFilters({
  value,
  onChange,
}: {
  value: PipelineFilterState
  onChange: (next: PipelineFilterState) => void
}) {
  const active = [value.department, value.status, value.from, value.to].filter(
    Boolean
  ).length
  const set = (patch: Partial<PipelineFilterState>) =>
    onChange({ ...value, ...patch })

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-72">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search RFPs…"
          aria-label="Search RFPs"
          className="pl-9"
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <Filter />
            Filter{active ? ` (${active})` : ''}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80 space-y-5 rounded p-4 shadow-md"
        >
          <div>
            <Label
              htmlFor="filter-department"
              className="mb-1.5 block text-sm font-medium"
            >
              Department
            </Label>
            <Select
              value={value.department || ALL}
              onValueChange={(v) => set({ department: v === ALL ? '' : v })}
            >
              <SelectTrigger id="filter-department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label
              htmlFor="filter-status"
              className="mb-1.5 block text-sm font-medium"
            >
              Status
            </Label>
            <Select
              value={value.status || ALL}
              onValueChange={(v) =>
                set({ status: v === ALL ? '' : (v as RfpStatus) })
              }
            >
              <SelectTrigger id="filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {RFP_STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {RFP_STATUS[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="filter-from"
                className="mb-1.5 block text-sm font-medium"
              >
                Created from
              </Label>
              <Input
                id="filter-from"
                type="date"
                value={value.from}
                onChange={(e) => set({ from: e.target.value })}
              />
            </div>
            <div>
              <Label
                htmlFor="filter-to"
                className="mb-1.5 block text-sm font-medium"
              >
                Created to
              </Label>
              <Input
                id="filter-to"
                type="date"
                value={value.to}
                onChange={(e) => set({ to: e.target.value })}
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={!active}
            onClick={() => onChange({ ...NO_FILTERS, search: value.search })}
          >
            Clear filters
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
