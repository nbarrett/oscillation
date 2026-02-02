"use client"

import { useEffect } from "react"
import { X, UserPlus } from "lucide-react"
import { useNotificationStore } from "@/stores/notification-store"
import { cn } from "@/lib/cn"

const AUTO_DISMISS_MS = 4000

export function NotificationBanner() {
  const { notifications, removeNotification } = useNotificationStore()

  useEffect(() => {
    if (notifications.length === 0) return

    const timers = notifications.map((notification) => {
      const elapsed = Date.now() - notification.timestamp
      const remaining = Math.max(AUTO_DISMISS_MS - elapsed, 0)

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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] flex flex-col gap-2 w-full max-w-md px-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3 shadow-lg",
            "animate-in slide-in-from-top-2 fade-in-0 duration-200",
            notification.type === "success"
              ? "border-green-500/50 bg-green-500/10"
              : "border-blue-500/50 bg-blue-500/10"
          )}
        >
          <UserPlus
            className={cn(
              "h-5 w-5 shrink-0",
              notification.type === "success" ? "text-green-600" : "text-blue-600"
            )}
          />
          <p
            className={cn(
              "flex-1 text-sm font-medium",
              notification.type === "success" ? "text-green-700" : "text-blue-700"
            )}
          >
            {notification.message}
          </p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title="Dismiss"
          >
            <X
              className={cn(
                "h-4 w-4",
                notification.type === "success" ? "text-green-600" : "text-blue-600"
              )}
            />
            <span className="sr-only">Close</span>
          </button>
        </div>
      ))}
    </div>
  )
}
