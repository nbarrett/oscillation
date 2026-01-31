"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Loader2, Gamepad2, ChevronDown, Settings } from "lucide-react"
import { useMapStore } from "@/stores/map-store"
import { trpc } from "@/lib/trpc/client"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/cn"

const DiceRoller = dynamic(() => import("@/components/DiceRoller"), { ssr: false })
const PlayerPositions = dynamic(() => import("@/components/PlayerPositions"), { ssr: false })
const MapWithCars = dynamic(
  () => import("@/components/MapWithCars"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[75vh] w-full flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
)
const ProfileSelector = dynamic(() => import("@/components/ProfileSelector"), { ssr: false })
const MapLayerSelector = dynamic(() => import("@/components/MapLayerSelector"), { ssr: false })
const MappingProviderSelector = dynamic(() => import("@/components/MappingProviderSelector"), { ssr: false })
const StartingPositionSelector = dynamic(() => import("@/components/StartingPositionSelector"), { ssr: false })
const MapPositions = dynamic(() => import("@/components/MapPositions"), { ssr: false })

export default function GamePage() {
  const setAccessToken = useMapStore((state) => state.setAccessToken)
  const { data: tokenData } = trpc.token.getRawToken.useQuery()
  const [settingsExpanded, setSettingsExpanded] = useState(false)

  useEffect(() => {
    if (tokenData) {
      setAccessToken(tokenData)
    }
  }, [tokenData, setAccessToken])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <a
              href="https://labs.os.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <div className="relative h-8 w-[80px] bg-white rounded p-0.5">
                <img
                  src="https://labs.os.uk/static/media/os-logo.svg"
                  alt="Ordnance Survey"
                  className="h-full w-full object-contain"
                />
              </div>
            </a>
            <div className="flex items-center gap-1.5">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-primary">Oscillation</h1>
            </div>
            <span className="hidden sm:inline-block text-xs text-muted-foreground">
              v0.2
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="w-full px-4 py-3 flex-1 flex flex-col gap-3">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                <PlayerPositions />

                <div className="hidden md:block h-8 w-px bg-border" />

                <div className="py-2 md:py-0">
                  <DiceRoller />
                </div>
              </div>

              <div className="hidden lg:block h-8 w-px bg-border" />

              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-muted border",
                  settingsExpanded && "bg-muted"
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    settingsExpanded && "rotate-180"
                  )}
                />
              </button>
            </div>

            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                settingsExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="pt-4 pb-1 border-t">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <ProfileSelector />
                    <MappingProviderSelector />
                    <MapLayerSelector />
                    <StartingPositionSelector />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden flex-1">
          <CardContent className="p-0 h-full">
            <div className="h-[75vh] min-h-[400px] relative">
              <MapWithCars />
              <MapPositions />
            </div>
          </CardContent>
        </Card>

        <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 py-3 text-xs text-muted-foreground">
          <p>
            Built with{" "}
            <a href="https://create.t3.gg" className="font-medium underline underline-offset-4 hover:text-primary">
              T3 Stack
            </a>
            {" "}•{" "}
            <a href="https://osdatahub.os.uk" className="font-medium underline underline-offset-4 hover:text-primary">
              OS Maps API
            </a>
          </p>
          <p>© {new Date().getFullYear()} Oscillation. In memory of Kerry Barrett.</p>
        </footer>
      </main>
    </div>
  )
}
