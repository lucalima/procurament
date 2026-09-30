import type { InternalRole } from '@/lib/auth/claims'

/** Signed-in internal user as shown in the app shell. */
export interface ShellUser {
  fullName: string
  email: string
  avatarUrl: string | null
  role: InternalRole
}

export const ROLE_LABELS: Record<InternalRole, string> = {
  procurement_manager: 'Procurement Manager',
  department_head: 'Department Head',
  finance_approver: 'Finance Approver',
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
}
