"use client"

import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import { useDeckStore } from "@/stores/deck-store"
import { createGridPolygon } from "@/lib/grid-polygon"
import { type ObstructionColor } from "@/lib/card-decks"

const OBSTRUCTION_COLORS: Record<ObstructionColor, string> = {
  blue: "#3b82f6",
  yellow: "#eab308",
  green: "#22c55e",
}

export default function ObstructionMarkers() {
  const map = useMap()
  const layerRef = useRef<L.LayerGroup | null>(null)
  const obstructions = useDeckStore((s) => s.obstructions)

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    const group = L.layerGroup()
    layerRef.current = group

    for (const obstruction of obstructions) {
      const color = OBSTRUCTION_COLORS[obstruction.color]
      const poly = createGridPolygon(map, obstruction.gridKey, color, 0.4, 2)
      if (poly) {
        group.addLayer(poly)
      }
    }

    group.addTo(map)

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, obstructions])

  return null
}
