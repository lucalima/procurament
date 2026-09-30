import { create } from 'zustand'

/** Notification bell UI state (Tech Stack §7.2). */
interface NotificationState {
  unreadCount: number
  setUnreadCount: (count: number) => void
  dropdownOpen: boolean
  setDropdownOpen: (open: boolean) => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  dropdownOpen: false,
  setDropdownOpen: (open) => set({ dropdownOpen: open }),
}))
