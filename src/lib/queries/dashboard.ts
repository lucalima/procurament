import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'

import { createClient } from '@/lib/supabase/client'
import type { Enums } from '@/types/database'

const DAYS = 30
const ACTIVE_EXCLUDED: Enums<'rfp_status'>[] = ['contracted', 'archived']

/** Count of rows created per day over the last 30 days, oldest first (Content Guidelines §9.2). */
function dailySeries(dates: string[]) {
  const counts = new Map<string, number>()
  dates.forEach((d) => {
    const day = d.slice(0, 10)
    counts.set(day, (counts.get(day) ?? 0) + 1)
  })
  return Array.from({ length: DAYS }, (_, i) => {
    const day = format(subDays(new Date(), DAYS - 1 - i), 'yyyy-MM-dd')
    return { day, value: counts.get(day) ?? 0 }
  })
}

export interface StatSeries {
  value: number
  series: { day: string; value: number }[]
}

/**
 * PM dashboard data (App Flow §4). Read straight from Supabase with the
 * signed-in PM's session; RLS scopes every query to their org.
 */
export function usePmDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'pm'],
    queryFn: async () => {
      const supabase = createClient()
      const since = subDays(new Date(), DAYS).toISOString()
      const soon = format(subDays(new Date(), -90), 'yyyy-MM-dd')

      const [rfps, entries, approvals, contracts, activity] = await Promise.all(
        [
          supabase
            .from('rfps')
            .select(
              'id, title, department, status, created_at, updated_at, rfp_vendor_entries(count)'
            )
            .eq('is_deleted', false)
            .order('updated_at', { ascending: false }),
          supabase
            .from('rfp_vendor_entries')
            .select('status, created_at, rfps!inner(status, is_deleted)'),
          supabase.from('approval_requests').select('status, created_at'),
          supabase
            .from('contracts')
            .select(
              'id, title, status, end_date, created_at, vendor_accounts(company_name)'
            )
            .eq('is_deleted', false),
          supabase
            .from('activity_log')
            .select('id, description, created_at, actor_type')
            .order('created_at', { ascending: false })
            .limit(10),
        ]
      )
      const failed = [rfps, entries, approvals, contracts, activity].find(
        (r) => r.error
      )
      if (failed?.error) throw failed.error
      const rfpRows = rfps.data ?? []
      const contractRows = contracts.data ?? []

      const activeRfps = rfpRows.filter(
        (r) => !ACTIVE_EXCLUDED.includes(r.status)
      )
      const evaluating = (entries.data ?? []).filter(
        (e) =>
          ['submitted', 'under_review'].includes(e.status) &&
          !e.rfps.is_deleted &&
          !ACTIVE_EXCLUDED.includes(e.rfps.status)
      )
      const pending = (approvals.data ?? []).filter(
        (a) => a.status === 'pending'
      )
      const expiring = contractRows.filter((c) => c.status === 'expiring_soon')
      const recent = (rows: { created_at: string }[]) =>
        rows.filter((r) => r.created_at >= since).map((r) => r.created_at)

      return {
        stats: {
          activeRfps: {
            value: activeRfps.length,
            series: dailySeries(recent(activeRfps)),
          },
          vendorsUnderEvaluation: {
            value: evaluating.length,
            series: dailySeries(recent(evaluating)),
          },
          pendingApprovals: {
            value: pending.length,
            series: dailySeries(recent(pending)),
          },
          contractsExpiringSoon: {
            value: expiring.length,
            series: dailySeries(recent(expiring)),
          },
        } satisfies Record<string, StatSeries>,
        snapshot: rfpRows.slice(0, 5).map(({ rfp_vendor_entries, ...r }) => ({
          ...r,
          vendor_count: rfp_vendor_entries[0]?.count ?? 0,
        })),
        renewals: contractRows
          .filter(
            (c) =>
              (c.status === 'active' || c.status === 'expiring_soon') &&
              c.end_date <= soon
          )
          .sort((a, b) => a.end_date.localeCompare(b.end_date)),
        activity: activity.data ?? [],
      }
    },
  })
}
