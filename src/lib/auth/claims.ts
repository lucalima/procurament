import type { Enums } from '@/types/database'

export type UserType = 'internal' | 'vendor'
export type InternalRole = Enums<'user_role'>
export type AppRole = InternalRole | 'vendor'

/** app_metadata injected into the JWT by custom_access_token_hook (Backend Schema §4.2). */
export interface AppClaims {
  userId: string
  email: string | null
  userType: UserType
  role: AppRole
  orgId: string
}

const ROLES: readonly AppRole[] = [
  'procurement_manager',
  'department_head',
  'finance_approver',
  'vendor',
]

/**
 * Reads the hook's app_metadata from verified JWT claims. Returns null when the
 * hook added nothing, which means the account is deactivated (or a vendor
 * whose invite has not been accepted).
 */
export function readAppClaims(claims: unknown): AppClaims | null {
  if (!claims || typeof claims !== 'object') return null
  const c = claims as Record<string, unknown>
  const meta = c.app_metadata as Record<string, unknown> | undefined
  if (!meta || typeof c.sub !== 'string') return null

  const userType = meta.user_type
  const role = meta.role
  const orgId = meta.org_id
  if (userType !== 'internal' && userType !== 'vendor') return null
  if (typeof role !== 'string' || !ROLES.includes(role as AppRole)) return null
  if (typeof orgId !== 'string') return null

  return {
    userId: c.sub,
    email: typeof c.email === 'string' ? c.email : null,
    userType,
    role: role as AppRole,
    orgId,
  }
}

/** Where each user type lands after sign-in (App Flow §3). */
export function homePathFor(claims: Pick<AppClaims, 'userType'>): string {
  return claims.userType === 'vendor' ? '/vendor' : '/dashboard'
}
