"use client"

import { CheckCircle2, Circle, MapPin } from "lucide-react"
import { useGameStore } from "@/stores/game-store"
import { POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"
import { cn } from "@/lib/cn"

const CATEGORY_COLORS: Record<string, string> = {
  pub: "text-blue-600",
  spire: "text-purple-700",
  tower: "text-pink-500",
  phone: "text-yellow-600",
  school: "text-green-600",
}

export default function GameObjectives() {
  const { selectedPois, players, localPlayerName } = useGameStore()

  if (!selectedPois || selectedPois.length === 0) return null

  const localPlayer = players.find(p => p.name === localPlayerName)
  const visitedSet = new Set(localPlayer?.visitedPois ?? [])
  const allVisited = selectedPois.every(poi => visitedSet.has(`${poi.category}:${poi.osmId}`))

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Objectives
      </span>
      <div className="flex flex-wrap gap-2">
        {selectedPois.map((poi) => {
          const poiId = `${poi.category}:${poi.osmId}`
          const visited = visitedSet.has(poiId)
          const colorClass = CATEGORY_COLORS[poi.category] ?? "text-muted-foreground"

          return (
            <div
              key={poiId}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border",
                visited
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-card border-input"
              )}
            >
              {visited ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <Circle className={cn("h-3.5 w-3.5 shrink-0", colorClass)} />
              )}
              <span className={cn("font-medium", visited && "line-through opacity-70")}>
                {POI_CATEGORY_LABELS[poi.category as PoiCategory] ?? poi.category}
              </span>
            </div>
          )
        })}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border",
            localPlayer?.hasReturnedToStart
              ? "bg-primary/10 border-primary/30 text-primary"
              : allVisited
                ? "bg-card border-input animate-pulse"
                : "bg-card border-input opacity-50"
          )}
        >
          {localPlayer?.hasReturnedToStart ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
          ) : (
            <MapPin className={cn("h-3.5 w-3.5 shrink-0", allVisited ? "text-orange-500" : "text-muted-foreground")} />
          )}
          <span className={cn("font-medium", localPlayer?.hasReturnedToStart && "line-through opacity-70")}>
            Return to start
          </span>
        </div>
      </div>
    </div>
  )
}
