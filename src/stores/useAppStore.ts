import { create } from 'zustand'

/** UI-only state (Tech Stack §7.2). Server data belongs in the TanStack Query cache. */
interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  activeModal: string | null
  openModal: (id: string) => void
  closeModal: () => void
  globalSearchQuery: string
  setGlobalSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>()((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  globalSearchQuery: '',
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
}))
