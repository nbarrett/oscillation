"use client"

import { useEffect, useRef, useState } from "react"
import { X, AlertCircle, Trash2, ChevronDown, Copy, ClipboardCheck } from "lucide-react"
import { useErrorStore, type ErrorItem } from "@/stores/error-store"
import { cn } from "@/lib/cn"

const AUTO_DISMISS_MS = 5000
const MAX_HISTORY = 50

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className={cn("shrink-0 opacity-50 hover:opacity-100 transition-opacity", className)}
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? <ClipboardCheck className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

function ErrorHistoryRow({ error, onRemove }: { error: ErrorItem; onRemove: (id: string) => void }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 border-b border-border/50 last:border-b-0 text-xs">
      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-foreground break-words">{error.message}</p>
        <p className="text-muted-foreground mt-0.5">{formatTime(error.timestamp)}</p>
      </div>
      <CopyButton text={`[${formatTime(error.timestamp)}] ${error.message}`} />
      <button
        onClick={() => onRemove(error.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        title="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function ErrorSnackbar() {
  const { errors, dismissError, removeError, clearAll, panelOpen, togglePanel } = useErrorStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const latestUndismissed = errors.filter((e) => !e.dismissed).at(-1) ?? null
  const errorCount = errors.length

  useEffect(() => {
    if (!latestUndismissed) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      dismissError(latestUndismissed.id)
    }, AUTO_DISMISS_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [latestUndismissed?.id, dismissError])

  useEffect(() => {
    if (errors.length > MAX_HISTORY) {
      const excess = errors.slice(0, errors.length - MAX_HISTORY)
      for (const e of excess) {
        removeError(e.id)
      }
    }
  }, [errors.length, removeError])

  if (errorCount === 0 && !latestUndismissed) return null

  return (
    <>
      {latestUndismissed && !panelOpen && (
        <div className="fixed bottom-16 right-4 z-[9999] w-full max-w-sm">
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 backdrop-blur-sm p-3 shadow-lg",
              "animate-in slide-in-from-bottom-2 fade-in-0 duration-200"
            )}
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
            <p className="flex-1 text-sm text-destructive">{latestUndismissed.message}</p>
            <CopyButton text={latestUndismissed.message} className="opacity-70 hover:opacity-100" />
            <button
              onClick={() => dismissError(latestUndismissed.id)}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              title="Dismiss"
            >
              <X className="h-4 w-4 text-destructive" />
            </button>
          </div>
        </div>
      )}

      {errorCount > 0 && (
        <button
          onClick={togglePanel}
          className={cn(
            "fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-full px-3 py-2 shadow-lg transition-colors",
            "border border-destructive/50 bg-destructive/10 backdrop-blur-sm hover:bg-destructive/20",
          )}
          title={panelOpen ? "Close error history" : "View error history"}
        >
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-xs font-medium text-destructive">{errorCount}</span>
          <ChevronDown className={cn(
            "h-3 w-3 text-destructive transition-transform",
            panelOpen && "rotate-180",
          )} />
        </button>
      )}

      {panelOpen && (
        <div className="fixed bottom-14 right-4 z-[9998] w-full max-w-sm animate-in slide-in-from-bottom-2 fade-in-0 duration-150">
          <div className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
              <span className="text-xs font-medium text-foreground">
                Errors ({errorCount})
              </span>
              <div className="flex items-center gap-2">
                <CopyButton
                  text={errors.map((e) => `[${formatTime(e.timestamp)}] ${e.message}`).join("\n")}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                />
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {errors.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No errors</p>
              ) : (
                [...errors].reverse().map((error) => (
                  <ErrorHistoryRow key={error.id} error={error} onRemove={removeError} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
