"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Trash2, Users, Gamepad2, Settings, RefreshCw, AlertTriangle } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      alert(`Deleted ${data.deletedCount} sessions`)
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

  // TODO: Add proper admin role check
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
        {/* Warning banner */}
        <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm">
              <strong>Development Mode:</strong> Admin access is not restricted.
              Add proper authentication before deploying to production.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="games" className="space-y-4">
          <TabsList>
            <TabsTrigger value="games" className="gap-2">
              <Gamepad2 className="h-4 w-4" />
              Games
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

          {/* Games Tab */}
          <TabsContent value="games">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Game Sessions</CardTitle>
                    <CardDescription>
                      Manage all game sessions. {sessions?.length ?? 0} total.
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
                        <TableHead>Players</TableHead>
                        <TableHead>Turn</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions?.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono font-bold">{session.code}</TableCell>
                          <TableCell>
                            <span title={session.players.map(p => p.name).join(", ")}>
                              {session.playerCount}
                            </span>
                          </TableCell>
                          <TableCell>{session.currentTurn}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(session.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget({
                                type: "session",
                                id: session.id,
                                name: session.code
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
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
                        <TableHead>Games Played</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.nickname}</TableCell>
                          <TableCell>{user.gamesPlayed}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
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

      {/* Delete confirmation dialog */}
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
