"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { useGameStore } from "@/stores/game-store"
import { useChatStore } from "@/stores/chat-store"
import { carImageForStyle } from "@/stores/car-store"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/cn"

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  width: number
  onWidthChange: (width: number) => void
}

export default function ChatPanel({ isOpen, onClose, width, onWidthChange }: ChatPanelProps) {
  const sessionId = useGameStore((s) => s.sessionId)
  const playerId = useGameStore((s) => s.playerId)
  const localPlayerName = useGameStore((s) => s.localPlayerName)

  const { messages, lastMessageId, addMessages } = useChatStore()
  const [text, setText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragging = useRef(false)

  const { data } = trpc.chat.messages.useQuery(
    { sessionId: sessionId!, afterId: lastMessageId },
    {
      enabled: !!sessionId && isOpen,
      refetchInterval: 3000,
      refetchOnWindowFocus: false,
    }
  )

  const sendMutation = trpc.chat.send.useMutation()

  useEffect(() => {
    if (data && data.length > 0) {
      addMessages(data)
    }
  }, [data])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"))
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    const startX = e.clientX
    const startWidth = width

    function onMouseMove(ev: MouseEvent) {
      if (!dragging.current) return
      const delta = startX - ev.clientX
      const newWidth = Math.max(250, Math.min(600, startWidth + delta))
      onWidthChange(newWidth)
      window.dispatchEvent(new Event("resize"))
    }

    function onMouseUp() {
      dragging.current = false
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      window.dispatchEvent(new Event("resize"))
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [width, onWidthChange])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || !sessionId || !playerId) return
    sendMutation.mutate({ sessionId, playerId, text: trimmed })
    setText("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div className="flex h-full" style={{ width: `${width}px`, minWidth: `${width}px` }}>
      <div
        className="w-1.5 cursor-col-resize bg-border hover:bg-primary/30 transition-colors shrink-0"
        onMouseDown={handleMouseDown}
      />
      <div className="flex-1 flex flex-col bg-card border-l min-w-0">
        <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Game Chat</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet
            </p>
          )}
          {messages.map((msg) => {
            const isMe = msg.playerName === localPlayerName
            return (
              <div key={msg.id} className={cn("flex gap-2", isMe && "flex-row-reverse")}>
                <img
                  src={carImageForStyle(msg.playerIconType)}
                  alt=""
                  className="h-5 w-8 object-contain shrink-0 mt-1"
                />
                <div className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}>
                  <div className={cn(
                    "text-xs font-semibold mb-0.5",
                    isMe ? "opacity-80" : "text-foreground"
                  )}>
                    {msg.playerName}
                  </div>
                  <div className="break-words">{msg.text}</div>
                  <div className={cn(
                    "text-[10px] mt-1 opacity-60"
                  )}>
                    {formatTime(msg.sentAt)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-2 border-t flex gap-2 shrink-0">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={500}
            className="text-sm h-8"
          />
          <button
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
