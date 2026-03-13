"use client"

import { useRef, useEffect } from "react"
import { useGameStore, type ActivityEntry } from "@/stores/game-store"
import { cn } from "@/lib/cn"

const TOKEN_HEX: Record<string, string> = {
  blue: "#2563eb",
  black: "#374151",
  pink: "#ec4899",
  yellow: "#ca8a04",
  green: "#16a34a",
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

function EntryRow({ entry, isLocal }: { entry: ActivityEntry; isLocal: boolean }) {
  const dotColour = entry.tokenColour ? (TOKEN_HEX[entry.tokenColour] ?? "#374151") : "#6b7280"

  return (
    <div className={cn(
      "flex items-start gap-2 px-3 py-1.5 text-xs",
      isLocal && "bg-primary/5"
    )}>
      <span
        className="mt-0.5 shrink-0 h-2.5 w-2.5 rounded-full border border-white/30"
        style={{ backgroundColor: dotColour }}
      />
      <span className="flex-1 leading-snug text-foreground/80">{entry.message}</span>
      <span className="shrink-0 text-muted-foreground tabular-nums">{formatTime(entry.timestamp)}</span>
    </div>
  )
}

interface ActivityLogProps {
  maxRows?: number
}

export default function ActivityLog({ maxRows = 6 }: ActivityLogProps) {
  const activityLog = useGameStore((s) => s.activityLog)
  const localPlayerName = useGameStore((s) => s.localPlayerName)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const visible = activityLog.slice(-maxRows)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activityLog.length])

  if (activityLog.length === 0) {
    return (
      <div className="text-xs text-muted-foreground px-3 py-2 italic">
        No activity yet — collect your first token to get started.
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border/50">
      {visible.map((entry, i) => (
        <EntryRow
          key={i}
          entry={entry}
          isLocal={entry.playerName === localPlayerName}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
