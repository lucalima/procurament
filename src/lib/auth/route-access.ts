import type { InternalRole } from '@/lib/auth/claims'

const PM: InternalRole = 'procurement_manager'
const DH: InternalRole = 'department_head'
const FA: InternalRole = 'finance_approver'

/**
 * Internal routes limited to certain roles (App Flow §1 site map). Checked in
 * order; the first matching pattern wins. Routes not listed are open to every
 * internal role (/dashboard, /activity, /search, /account).
 */
const RESTRICTED: { pattern: RegExp; roles: InternalRole[] }[] = [
  // The comparison report is readable by the Department Head too.
  { pattern: /^\/pipeline\/rfp\/[^/]+\/report\/?$/, roles: [PM, DH] },
  { pattern: /^\/pipeline(\/|$)/, roles: [PM] },
  { pattern: /^\/contracts(\/|$)/, roles: [PM] },
  { pattern: /^\/settings(\/|$)/, roles: [PM] },
  { pattern: /^\/requirements(\/|$)/, roles: [PM, DH] },
  { pattern: /^\/approvals(\/|$)/, roles: [FA] },
]

export function canAccessInternalPath(pathname: string, role: InternalRole) {
  const rule = RESTRICTED.find((r) => r.pattern.test(pathname))
  return rule ? rule.roles.includes(role) : true
}
