"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"
import { Check, Loader2, LocateFixed } from "lucide-react"
import { useCurrentPlayer, useGameStore } from "@/stores/game-store"
import { POI_CATEGORIES, POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"
import { POI_COLOURS } from "@/stores/poi-icons"
import { usePoiSettingsStore } from "@/stores/poi-settings-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"

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

function firstUnpickedCategory(pickedCategories: Set<string>): PoiCategory | null {
  return POI_CATEGORIES.find((c) => !pickedCategories.has(c)) ?? null
}

export default function PoiPicker() {
  const { selectedPois, playerId, creatorPlayerId, setPlayerZoomRequest, activePickingCategory, setActivePickingCategory } = useGameStore()
  const player = useCurrentPlayer()
  const { iconDetailMode, setIconDetailMode } = usePoiSettingsStore()
  const isCreator = playerId !== null && playerId === creatorPlayerId
  const pickedCategories = new Set((selectedPois ?? []).map(p => p.category))
  const allPicked = pickedCategories.size === POI_CATEGORIES.length

  const activeCategory = activePickingCategory ?? firstUnpickedCategory(pickedCategories)

  useEffect(() => {
    if (activePickingCategory && pickedCategories.has(activePickingCategory)) {
      const next = firstUnpickedCategory(pickedCategories)
      setActivePickingCategory(next)
    }
  }, [selectedPois])

  return (
    <>
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {allPicked
                  ? "All Staging Posts placed"
                  : isCreator
                    ? "Place the Staging Posts"
                    : "Waiting for host to place Staging Posts..."}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex rounded-md border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIconDetailMode("detailed")}
                    className={cn(
                      "px-2 py-1 text-xs font-medium transition-colors",
                      iconDetailMode === "detailed"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    Detailed
                  </button>
                  <button
                    type="button"
                    onClick={() => setIconDetailMode("simple")}
                    className={cn(
                      "px-2 py-1 text-xs font-medium transition-colors",
                      iconDetailMode === "simple"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    Simple
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPlayerZoomRequest(player?.name ?? "")}
                  disabled={!player?.name}
                >
                  <LocateFixed className="h-3.5 w-3.5" />
                  Find My Car
                </Button>
                <span className="text-xs text-muted-foreground">
                  {pickedCategories.size} / {POI_CATEGORIES.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-5 items-center w-full">
              {POI_CATEGORIES.map((category, index) => {
                const picked = pickedCategories.has(category)
                const isActive = category === activeCategory
                const colour = POI_COLOURS[category as keyof typeof POI_COLOURS]
                const isClickable = picked || isActive
                const isLast = index === POI_CATEGORIES.length - 1

                return (
                  <div key={category} className="flex items-center">
                    <button
                      type="button"
                      disabled={!isClickable}
                      onClick={() => {
                        if (picked || isActive) {
                          setActivePickingCategory(category)
                        }
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                        picked && "bg-primary/15 text-primary cursor-pointer hover:bg-primary/25",
                        isActive && !picked && "text-white",
                        !picked && !isActive && "bg-muted text-muted-foreground cursor-default",
                      )}
                      style={isActive && !picked ? { backgroundColor: colour } : {}}
                    >
                      {picked && <Check className="h-3 w-3 shrink-0" />}
                      {!picked && !isActive && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: colour }}
                        />
                      )}
                      {POI_CATEGORY_LABELS[category as PoiCategory]}
                    </button>
                    {!isLast && (
                      <div className={cn(
                        "flex-1 h-0.5 mx-0.5",
                        picked ? "bg-primary/30" : "bg-border",
                      )} />
                    )}
                  </div>
                )
              })}
            </div>

            {activeCategory && !allPicked && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: POI_COLOURS[activeCategory as keyof typeof POI_COLOURS] }}
                />
                Place a Staging Post on a {POI_CATEGORY_LABELS[activeCategory as PoiCategory]?.replace(/s$/, "")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[calc(100vh-280px)] min-h-[400px] relative">
            <MapWithCars />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
