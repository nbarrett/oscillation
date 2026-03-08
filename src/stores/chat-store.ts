import { create } from "zustand"

export interface ChatMessage {
  id: string
  text: string
  playerName: string
  playerIconType: string
  sentAt: string
}

interface ChatState {
  messages: ChatMessage[]
  lastMessageId: string | null
  isOpen: boolean
  unreadCount: number
  addMessages: (msgs: ChatMessage[]) => void
  setOpen: (open: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  lastMessageId: null,
  isOpen: false,
  unreadCount: 0,

  addMessages: (msgs) => {
    if (msgs.length === 0) return
    const existing = new Set(get().messages.map((m) => m.id))
    const fresh = msgs.filter((m) => !existing.has(m.id))
    if (fresh.length === 0) return
    const lastId = fresh[fresh.length - 1].id
    set((state) => ({
      messages: [...state.messages, ...fresh],
      lastMessageId: lastId,
      unreadCount: state.isOpen ? 0 : state.unreadCount + fresh.length,
    }))
  },

  setOpen: (open) =>
    set((state) => ({ isOpen: open, unreadCount: open ? 0 : state.unreadCount })),

  clearMessages: () =>
    set({ messages: [], lastMessageId: null, unreadCount: 0 }),
}))
