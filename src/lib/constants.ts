/** Fixed department list (user decision 2026-09-30; there is no departments table). */
export const DEPARTMENTS = [
  'IT',
  'Finance',
  'HR',
  'Operations',
  'Marketing',
  'Legal',
  'Facilities',
] as const

/** Currencies offered for the organisation default (defaults to USD, App Flow §3.1). */
export const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'INR',
  'JPY',
  'SGD',
  'AED',
  'ZAR',
] as const

/** Team invite roles offered in onboarding (App Flow §3.1 step 2). */
export const INVITABLE_ROLES = [
  { value: 'department_head', label: 'Department Head' },
  { value: 'finance_approver', label: 'Finance Approver' },
] as const

export const MAX_ONBOARDING_INVITES = 10
