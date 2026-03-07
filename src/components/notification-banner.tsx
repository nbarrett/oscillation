"use client"

import { useEffect } from "react"
import { X, Info, CheckCircle2, AlertTriangle } from "lucide-react"
import { useNotificationStore } from "@/stores/notification-store"
import { cn } from "@/lib/cn"

const AUTO_DISMISS_MS = 4000
const ERROR_DISMISS_MS = 8000

export function NotificationBanner() {
  const { notifications, removeNotification } = useNotificationStore()

  useEffect(() => {
    if (notifications.length === 0) return

    const timers = notifications.map((notification) => {
      const dismissMs = notification.type === "error" ? ERROR_DISMISS_MS : AUTO_DISMISS_MS
      const elapsed = Date.now() - notification.timestamp
      const remaining = Math.max(dismissMs - elapsed, 0)

      return setTimeout(() => {
        removeNotification(notification.id)
      }, remaining)
    })

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [notifications, removeNotification])

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] flex flex-col gap-2 w-full max-w-sm px-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-2.5 shadow-lg backdrop-blur-sm",
            "animate-in slide-in-from-bottom-2 fade-in-0 duration-200",
            notification.type === "error"
              ? "border-[#d40058]/40 bg-[#d40058]/10 text-[#d40058]"
              : "border-[#453c90]/40 bg-[#453c90]/10 text-[#453c90]"
          )}
        >
          {notification.type === "error" ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <Info className="h-4 w-4 shrink-0" />
          )}
          <p className="flex-1 text-sm font-medium">
            {notification.message}
          </p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
