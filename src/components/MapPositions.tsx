"use client"

import { useGameStore } from "@/stores/game-store"
import { formatLatLong } from "@/lib/utils"

export default function MapPositions() {
  const { mapZoom, mapClickPosition, mapCentre } = useGameStore()

  return (
    <div className="absolute top-2 right-2 z-[1000] bg-background/95 backdrop-blur-sm rounded-md px-2 py-1 shadow-md border text-xs font-mono">
      <span className="text-muted-foreground">z{mapZoom || 0}</span>
      <span className="text-muted-foreground mx-1">|</span>
      <span>{mapCentre ? formatLatLong(mapCentre) : "—"}</span>
    </div>
  )
}
