"use client"

import { useSession, signOut } from "next-auth/react"
import { useGameStore } from "@/stores/game-store"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"

export function UserMenu() {
  const { data: session, status } = useSession()
  const { sessionId, playerId, leaveSession } = useGameStore()
  const utils = trpc.useUtils()

  const leaveMutation = trpc.game.leave.useMutation({
    onSuccess: () => {
      leaveSession()
      utils.game.state.invalidate()
    },
  })

  async function handleSignOut() {
    if (sessionId && playerId) {
      await leaveMutation.mutateAsync({ sessionId, playerId })
    }
    signOut()
  }

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
  }

  if (!session?.user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{session.user.nickname}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
