"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MessageCircle, X, Send, Pencil, Image as ImageIcon } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { useGameStore } from "@/stores/game-store"
import { useChatStore } from "@/stores/chat-store"
import { carImageForStyle } from "@/stores/car-store"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/cn"
import { emojify, searchEmoji } from "@/lib/emoji"

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function activeShortcode(text: string): string | null {
  const match = text.match(/:([a-z0-9_+-]{2,})$/)
  return match ? match[1] : null
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

  const { messages, lastMessageId, addMessages, updateMessage } = useChatStore()
  const [text, setText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [emojiResults, setEmojiResults] = useState<Array<{ code: string; emoji: string }>>([])
  const [emojiIndex, setEmojiIndex] = useState(0)
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
  const updateMutation = trpc.chat.update.useMutation()

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

  useEffect(() => {
    const query = activeShortcode(text)
    if (query) {
      const results = searchEmoji(query)
      setEmojiResults(results)
      setEmojiIndex(0)
    } else {
      setEmojiResults([])
    }
  }, [text])

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

  function completeEmoji(emoji: string) {
    const before = text.replace(/:([a-z0-9_+-]{2,})$/, "")
    setText(before + emoji)
    setEmojiResults([])
    inputRef.current?.focus()
  }

  function handleSend() {
    const converted = emojify(text.trim())
    if (!converted || !sessionId || !playerId) return

    if (editingId) {
      updateMutation.mutate(
        { messageId: editingId, playerId, text: converted },
        {
          onSuccess: (result) => {
            if (result.success) {
              updateMessage(editingId, converted)
            }
          },
        }
      )
      setEditingId(null)
      setText("")
      return
    }

    sendMutation.mutate({ sessionId, playerId, text: converted })
    setText("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()

    if (emojiResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setEmojiIndex((i) => Math.min(i + 1, emojiResults.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setEmojiIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault()
        const selected = emojiResults[emojiIndex]
        if (selected) {
          completeEmoji(selected.emoji)
        }
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setEmojiResults([])
        return
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === "ArrowUp" && text === "" && !editingId) {
      e.preventDefault()
      const myMessages = messages.filter((m) => m.playerName === localPlayerName)
      const last = myMessages[myMessages.length - 1]
      if (last && last.text) {
        setEditingId(last.id)
        setText(last.text)
      }
    }
    if (e.key === "Escape" && editingId) {
      setEditingId(null)
      setText("")
    }
  }

  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file || !sessionId || !playerId) return
        await uploadImage(file)
        return
      }
    }
  }

  async function uploadImage(file: File) {
    if (!sessionId || !playerId) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("sessionId", sessionId)

    const res = await fetch("/api/upload", { method: "POST", body: formData })
    const json = await res.json()
    setUploading(false)

    if (json.url) {
      const trimmed = text.trim()
      sendMutation.mutate({
        sessionId,
        playerId,
        text: trimmed || undefined,
        imageUrl: json.url,
      })
      setText("")
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
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt=""
                      className="max-w-full rounded mb-1 cursor-pointer"
                      onClick={() => window.open(msg.imageUrl!, "_blank")}
                    />
                  )}
                  {msg.text && <div className="break-words">{emojify(msg.text)}</div>}
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

        <div className="p-2 border-t shrink-0 relative">
          {emojiResults.length > 0 && (
            <div className="absolute bottom-full left-2 right-2 mb-1 bg-popover border rounded-lg shadow-lg overflow-hidden z-50">
              {emojiResults.map((item, i) => (
                <button
                  key={item.code}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-muted",
                    i === emojiIndex && "bg-muted"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    completeEmoji(item.emoji)
                  }}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-muted-foreground">:{item.code}:</span>
                </button>
              ))}
            </div>
          )}
          {editingId && (
            <div className="flex items-center gap-1.5 px-2 pb-1.5 text-xs text-amber-500">
              <Pencil className="h-3 w-3" />
              <span>Editing message</span>
              <button
                onClick={() => { setEditingId(null); setText("") }}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
          {uploading && (
            <div className="flex items-center gap-1.5 px-2 pb-1.5 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3 animate-pulse" />
              <span>Uploading image...</span>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={editingId ? "Edit message..." : "Type a message... (:emoji:)"}
              maxLength={500}
              className={cn("text-sm h-8", editingId && "border-amber-500/50")}
            />
            <button
              className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              onClick={handleSend}
              disabled={!text.trim() || sendMutation.isPending || updateMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
