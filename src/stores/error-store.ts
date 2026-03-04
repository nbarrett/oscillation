import { create } from "zustand"

export interface ErrorItem {
  id: string
  message: string
  timestamp: number
  dismissed: boolean
}

interface ErrorState {
  errors: ErrorItem[]
  panelOpen: boolean
  addError: (message: string) => void
  dismissError: (id: string) => void
  removeError: (id: string) => void
  clearAll: () => void
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
}

export const useErrorStore = create<ErrorState>()((set) => ({
  errors: [],
  panelOpen: false,

  addError: (message) => {
    const id = crypto.randomUUID()
    set((state) => ({
      errors: [...state.errors, { id, message, timestamp: Date.now(), dismissed: false }],
    }))
  },

  dismissError: (id) => {
    set((state) => ({
      errors: state.errors.map((e) => e.id === id ? { ...e, dismissed: true } : e),
    }))
  },

  removeError: (id) => {
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    }))
  },

  clearAll: () => {
    set({ errors: [], panelOpen: false })
  },

  setPanelOpen: (panelOpen) => set({ panelOpen }),

  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
}))
