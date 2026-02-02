import { create } from "zustand"

interface Notification {
  id: string
  message: string
  type: "info" | "success"
  timestamp: number
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (message: string, type?: "info" | "success") => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  addNotification: (message, type = "info") => {
    const id = crypto.randomUUID()
    set((state) => ({
      notifications: [...state.notifications, { id, message, type, timestamp: Date.now() }],
    }))
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
}))
