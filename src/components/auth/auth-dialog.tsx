"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AuthForm } from "./auth-form"

export function AuthDialog() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)

  if (status === "loading") {
    return <div className="w-20 h-8 rounded bg-muted animate-pulse" />
  }

  if (session?.user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Sign In</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogTitle className="sr-only">Sign in to Oscillation</DialogTitle>
        <AuthForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
