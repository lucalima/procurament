import { differenceInCalendarDays, format, parseISO } from 'date-fns'

export function formatCurrency(
  value: number | null | undefined,
  currency = 'USD'
) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatBudgetRange(
  min: number | null,
  max: number | null,
  currency = 'USD'
) {
  if (min === null && max === null) return '—'
  if (min !== null && max !== null) {
    return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`
  }
  return min !== null
    ? `From ${formatCurrency(min, currency)}`
    : `Up to ${formatCurrency(max, currency)}`
}

/**
 * Submission deadlines and contract dates are calendar dates: the picked day
 * is stored as midnight UTC (or as a plain date). Reading only the yyyy-mm-dd
 * part keeps the same day in every time zone.
 */
function calendarDate(value: string) {
  return parseISO(value.slice(0, 10))
}

/** Formats a calendar date (deadline, contract start/end) as "30 Nov 2026". */
export function formatDate(value: string | null | undefined) {
  return value ? format(calendarDate(value), 'd MMM yyyy') : '—'
}

/** Whole days from today until the calendar date (negative when past). */
export function daysUntil(value: string) {
  return differenceInCalendarDays(calendarDate(value), new Date())
}

/** Whole days since a timestamp (e.g. last activity). */
export function daysSince(value: string) {
  return differenceInCalendarDays(new Date(), new Date(value))
}
