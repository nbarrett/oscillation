"use client"

import { useGameStore } from "@/stores/game-store"
import { formatLatLong } from "@/lib/utils"

export default function MapPositions() {
  const { mapZoom, mapClickPosition, mapCentre } = useGameStore()

  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border text-xs">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div>
          <span className="text-muted-foreground">Zoom:</span>{" "}
          <span className="font-medium">{mapZoom || "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Click:</span>{" "}
          <span className="font-medium">
            {mapClickPosition?.latLng ? formatLatLong(mapClickPosition.latLng) : "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Centre:</span>{" "}
          <span className="font-medium">{mapCentre ? formatLatLong(mapCentre) : "—"}</span>
        </div>
      </div>
    </div>
  )
}
