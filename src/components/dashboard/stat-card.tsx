'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

import { Skeleton } from '@/components/ui/skeleton'
import { useCssColor } from '@/lib/use-css-color'
import type { StatSeries } from '@/lib/queries/dashboard'

/**
 * Dashboard stat card (Content Guidelines §6.4): label, value, icon in a tinted
 * circle and a 48px sparkline of the last 30 days (§9.2: no axes, grid or tooltip).
 */
export function StatCard({
  label,
  icon: Icon,
  stat,
  href,
  loading,
}: {
  label: string
  icon: LucideIcon
  stat: StatSeries | undefined
  href?: string
  loading: boolean
}) {
  const primary = useCssColor('--primary')

  const body = (
    <div className="rounded border border-border bg-card p-6 shadow-sm transition-shadow duration-150 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-16 bg-muted" />
          ) : (
            <p className="mt-2 font-heading text-3xl text-foreground">
              {stat?.value ?? 0}
            </p>
          )}
        </div>
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4 h-12" aria-hidden="true">
        {stat && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={stat.series}
              margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
            >
              <Area
                type="monotone"
                dataKey="value"
                stroke={primary}
                strokeWidth={1.5}
                fill={primary}
                fillOpacity={0.1}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )

  return href ? (
    <Link
      href={href}
      className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {body}
    </Link>
  ) : (
    body
  )
}
