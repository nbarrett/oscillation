import { create } from "zustand"

interface ErrorItem {
  id: string
  message: string
  timestamp: number
}

interface ErrorState {
  errors: ErrorItem[]
  addError: (message: string) => void
  removeError: (id: string) => void
  clearAll: () => void
}

export const useErrorStore = create<ErrorState>()((set) => ({
  errors: [],

  addError: (message) => {
    const id = crypto.randomUUID()
    set((state) => ({
      errors: [...state.errors, { id, message, timestamp: Date.now() }],
    }))
  },

  removeError: (id) => {
    set((state) => ({
      errors: state.errors.filter((error) => error.id !== id),
    }))
  },

  clearAll: () => {
    set({ errors: [] })
  },
}))
