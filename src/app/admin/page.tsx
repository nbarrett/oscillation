"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Trash2, Users, Gamepad2, Settings, RefreshCw, AlertTriangle, Shield, ShieldOff, Clock } from "lucide-react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { timeAgo } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Badge } from "@/components/ui/badge"

function phaseBadge(phase: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    lobby: "outline",
    picking: "secondary",
    playing: "default",
    ended: "destructive",
  }
  return <Badge variant={variants[phase] ?? "outline"}>{phase}</Badge>
}


export default function AdminPage() {
  const { data: session, status } = useSession()
  const [deleteTarget, setDeleteTarget] = useState<{ type: "session" | "user"; id: string; name: string } | null>(null)

  const utils = trpc.useUtils()

  const { data: sessions, isLoading: sessionsLoading } = trpc.admin.getAllSessions.useQuery()
  const { data: users, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery()
  const { data: settings } = trpc.admin.getSettings.useQuery()

  const deleteSession = trpc.admin.deleteSession.useMutation({
    onSuccess: () => {
      utils.admin.getAllSessions.invalidate()
      setDeleteTarget(null)
    },
  })

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate()
      setDeleteTarget(null)
    },
  })

  const clearOldSessions = trpc.admin.clearOldSessions.useMutation({
    onSuccess: (data) => {
      utils.admin.getAllSessions.invalidate()
      toast.success(`Deleted ${data.deletedCount} sessions`)
    },
  })

  const clearStaleLobby = trpc.admin.clearStaleLobbyGames.useMutation({
    onSuccess: (data) => {
      utils.admin.getAllSessions.invalidate()
      toast.success(`Deleted ${data.deletedCount} stale lobby games`)
    },
  })

  const toggleAdmin = trpc.admin.toggleAdmin.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate()
    },
  })

  function handleDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === "session") {
      deleteSession.mutate({ sessionId: deleteTarget.id })
    } else {
      deleteUser.mutate({ userId: deleteTarget.id })
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleString()
  }

  const staleLobbyCount = sessions?.filter(
    (s) => s.phase === "lobby" && Date.now() - new Date(s.updatedAt).getTime() > 60 * 60 * 1000
  ).length ?? 0

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {session?.user && (
              <span className="text-sm text-muted-foreground">
                {session.user.nickname}
                {session.user.isAdmin && (
                  <Badge variant="default" className="ml-2">Admin</Badge>
                )}
              </span>
            )}
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <a href="/">Back to Game</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        {!session?.user?.isAdmin && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-sm">
                <strong>Development Mode:</strong> Admin access is not restricted.
                Add proper authentication before deploying to production.
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="games" className="space-y-4">
          <TabsList>
            <TabsTrigger value="games" className="gap-2">
              <Gamepad2 className="h-4 w-4" />
              Games
              {staleLobbyCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {staleLobbyCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Game Sessions</CardTitle>
                    <CardDescription>
                      Manage all game sessions. {sessions?.length ?? 0} total.
                      {staleLobbyCount > 0 && (
                        <span className="text-destructive ml-2">
                          {staleLobbyCount} stale lobby {staleLobbyCount === 1 ? "game" : "games"}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => utils.admin.getAllSessions.invalidate()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    {staleLobbyCount > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="secondary" size="sm">
                            <Clock className="h-4 w-4 mr-2" />
                            Clear Stale Lobbies
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear stale lobby games?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete {staleLobbyCount} lobby {staleLobbyCount === 1 ? "game" : "games"} that {staleLobbyCount === 1 ? "has" : "have"} been
                              inactive for over 1 hour. This frees up players stuck on &ldquo;Waiting for host to start&rdquo;.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => clearStaleLobby.mutate()}>
                              Clear Stale Games
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Clear Old Games
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear old game sessions?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete all games older than 7 days.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => clearOldSessions.mutate({ olderThanDays: 7 })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sessions?.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No game sessions found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Phase</TableHead>
                        <TableHead>Players</TableHead>
                        <TableHead>Turn</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions?.map((s) => {
                        const isStale = s.phase === "lobby" && Date.now() - new Date(s.updatedAt).getTime() > 60 * 60 * 1000
                        return (
                          <TableRow key={s.id} className={isStale ? "bg-destructive/5" : ""}>
                            <TableCell className="font-mono font-bold">{s.code}</TableCell>
                            <TableCell>{phaseBadge(s.phase)}</TableCell>
                            <TableCell>
                              <span title={s.players.map(p => p.name).join(", ")}>
                                {s.playerCount}
                              </span>
                            </TableCell>
                            <TableCell>{s.currentTurn}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {timeAgo(s.updatedAt)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(s.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({
                                  type: "session",
                                  id: s.id,
                                  name: s.code
                                })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registered Users</CardTitle>
                    <CardDescription>
                      Manage user accounts. {users?.length ?? 0} total.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => utils.admin.getAllUsers.invalidate()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : users?.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No registered users found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nickname</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Games Played</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="w-[140px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.nickname}</TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <Badge variant="default">Admin</Badge>
                            ) : (
                              <Badge variant="outline">Player</Badge>
                            )}
                          </TableCell>
                          <TableCell>{user.gamesPlayed}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={user.isAdmin ? "Remove admin" : "Make admin"}
                                onClick={() => toggleAdmin.mutate({ userId: user.id, isAdmin: !user.isAdmin })}
                              >
                                {user.isAdmin ? (
                                  <ShieldOff className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <Shield className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({
                                  type: "user",
                                  id: user.id,
                                  name: user.nickname
                                })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
                <CardDescription>
                  Configure global game settings. (Placeholder - not yet persisted)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Max Players Per Game</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{settings?.maxPlayersPerGame ?? 8}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Session Timeout</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{settings?.sessionTimeoutMinutes ?? 60} min</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Guest Players</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {settings?.allowGuestPlayers ? "Allowed" : "Disabled"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-sm text-muted-foreground">
                  Settings editing coming soon. These are placeholder values.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === "session" ? "game session" : "user"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "session"
                ? `This will permanently delete game "${deleteTarget?.name}" and all associated data.`
                : `This will permanently delete user "${deleteTarget?.name}". Their game history will be preserved but unlinked.`
              }
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
