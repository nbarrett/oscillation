"use client"

import { useEffect, useState } from "react"
import { X, AlertCircle, Copy, Check } from "lucide-react"
import { useErrorStore } from "@/stores/error-store"
import { cn } from "@/lib/cn"

const AUTO_DISMISS_MS = 6000

export function ErrorSnackbar() {
  const { errors, removeError } = useErrorStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (errors.length === 0) return

    const timers = errors.map((error) => {
      const elapsed = Date.now() - error.timestamp
      const remaining = Math.max(AUTO_DISMISS_MS - elapsed, 0)

      return setTimeout(() => {
        removeError(error.id)
      }, remaining)
    })

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [errors, removeError])

  function copyError(id: string, message: string) {
    navigator.clipboard.writeText(message)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (errors.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {errors.map((error) => (
        <div
          key={error.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 shadow-lg",
            "animate-in slide-in-from-bottom-2 fade-in-0 duration-200"
          )}
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="flex-1 text-sm text-destructive">{error.message}</p>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => copyError(error.id, error.message)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              title="Copy error"
            >
              {copiedId === error.id ? (
                <Check className="h-4 w-4 text-destructive" />
              ) : (
                <Copy className="h-4 w-4 text-destructive" />
              )}
              <span className="sr-only">Copy error</span>
            </button>
            <button
              onClick={() => removeError(error.id)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              title="Dismiss"
            >
              <X className="h-4 w-4 text-destructive" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
