import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api/client'
import type { RFPInput, RFPUpdate } from '@/lib/schemas/rfp'
import type { VendorInviteInput } from '@/lib/schemas/vendor-invite'
import type { Enums, Tables } from '@/types/database'

export type RfpStatus = Enums<'rfp_status'>

export type RfpListItem = Pick<
  Tables<'rfps'>,
  | 'id'
  | 'title'
  | 'description'
  | 'department'
  | 'budget_min'
  | 'budget_max'
  | 'submission_deadline'
  | 'status'
  | 'requirement_id'
  | 'created_at'
  | 'updated_at'
> & { vendor_count: number }

export interface RfpVendorRow {
  entry_id: string
  status: Enums<'vendor_pipeline_status'>
  is_shortlisted: boolean
  invited_at: string
  vendor: Pick<
    Tables<'vendor_accounts'>,
    'id' | 'company_name' | 'contact_name' | 'email' | 'is_active'
  > | null
  submission_status: Enums<'submission_status'> | null
  document_count: number
  flag_count: number
  score: number | null
}

export interface RfpDetail {
  rfp: Omit<Tables<'rfps'>, 'search_vector'>
  evaluation: Pick<
    Tables<'evaluations'>,
    'id' | 'status' | 'scoring_run_count'
  > | null
  vendors: RfpVendorRow[]
}

export const rfpKeys = {
  all: ['rfps'] as const,
  list: () => [...rfpKeys.all, 'list'] as const,
  detail: (id: string) => [...rfpKeys.all, 'detail', id] as const,
}

export function useRfps() {
  return useQuery({
    queryKey: rfpKeys.list(),
    queryFn: () =>
      apiFetch<{ rfps: RfpListItem[] }>('/api/rfps').then((r) => r.rfps),
  })
}

export function useRfp(id: string) {
  return useQuery({
    queryKey: rfpKeys.detail(id),
    queryFn: () => apiFetch<RfpDetail>(`/api/rfps/${id}`),
  })
}

export function useCreateRfp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RFPInput) =>
      apiFetch<{ rfp: RfpListItem }>('/api/rfps', {
        method: 'POST',
        json: values,
      }).then((r) => r.rfp),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rfpKeys.all }),
  })
}

type RfpUpdateBody = Partial<RFPInput> & { status?: RfpStatus }

export function useUpdateRfp(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RfpUpdateBody) =>
      apiFetch<{ rfp: RfpListItem }>(`/api/rfps/${id}`, {
        method: 'PATCH',
        json: values,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: rfpKeys.all }),
  })
}

/**
 * Kanban drag: moves the card to its new column immediately (optimistic
 * TanStack cache update), persists the status, and rolls back on failure.
 */
export function useMoveRfp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RfpStatus }) =>
      apiFetch(`/api/rfps/${id}`, {
        method: 'PATCH',
        json: { status } satisfies RFPUpdate,
      }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: rfpKeys.list() })
      const previous = queryClient.getQueryData<RfpListItem[]>(rfpKeys.list())
      queryClient.setQueryData<RfpListItem[]>(rfpKeys.list(), (rfps) =>
        rfps?.map((r) => (r.id === id ? { ...r, status } : r))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(rfpKeys.list(), context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: rfpKeys.all }),
  })
}

export function useInviteVendor(rfpId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: VendorInviteInput) =>
      apiFetch<{ emailSent: boolean }>(`/api/rfps/${rfpId}/invite-vendor`, {
        method: 'POST',
        json: values,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rfpKeys.all }),
  })
}
