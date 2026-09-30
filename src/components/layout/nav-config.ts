import {
  Activity,
  CheckSquare,
  ClipboardList,
  FileText,
  Kanban,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'

import type { InternalRole } from '@/lib/auth/claims'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  roles: InternalRole[]
}

const ALL: InternalRole[] = [
  'procurement_manager',
  'department_head',
  'finance_approver',
]

/** Sidebar items and who sees them (App Flow §2.1; icons from Content Guidelines §10.3). */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
  {
    href: '/pipeline',
    label: 'Pipeline',
    icon: Kanban,
    roles: ['procurement_manager'],
  },
  {
    href: '/requirements',
    label: 'Requirements',
    icon: ClipboardList,
    roles: ['procurement_manager', 'department_head'],
  },
  {
    href: '/approvals',
    label: 'Approvals',
    icon: CheckSquare,
    roles: ['finance_approver'],
  },
  {
    href: '/contracts',
    label: 'Contracts',
    icon: FileText,
    roles: ['procurement_manager'],
  },
  { href: '/activity', label: 'Activity', icon: Activity, roles: ALL },
]

export function navItemsFor(role: InternalRole) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
