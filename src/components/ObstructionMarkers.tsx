"use client"

import { useEffect, useRef, useMemo } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import { useDeckStore } from "@/stores/deck-store"
import { usePoiSettingsStore } from "@/stores/poi-settings-store"
import { OBSTRUCTION_ICON_OPTIONS } from "@/stores/poi-icons"
import { gridKeyToCenter } from "@/lib/grid-polygon"
import { type ObstructionColor } from "@/lib/card-decks"

const OBSTRUCTION_COLORS: Record<ObstructionColor, string> = {
  blue: "#3b82f6",
  yellow: "#eab308",
  green: "#22c55e",
}

const ICON_SIZE = 48

function buildIcon(svgTemplate: string, colour: string): L.DivIcon {
  const coloured = svgTemplate
    .replace(/currentColor/g, colour)
    .replace(/<svg /, `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" `)

  return L.divIcon({
    html: coloured,
    className: "pub-marker-icon",
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
  })
}

export default function ObstructionMarkers() {
  const map = useMap()
  const layerRef = useRef<L.LayerGroup | null>(null)
  const obstructions = useDeckStore((s) => s.obstructions)
  const obstructionIconStyle = usePoiSettingsStore((s) => s.obstructionIconStyle)
  const iconDetailMode = usePoiSettingsStore((s) => s.iconDetailMode)

  const iconOption = useMemo(
    () =>
      OBSTRUCTION_ICON_OPTIONS.find((o) => o.style === obstructionIconStyle) ??
      OBSTRUCTION_ICON_OPTIONS[0]!,
    [obstructionIconStyle]
  )

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    const group = L.layerGroup()
    layerRef.current = group

    const svgSource = iconDetailMode === "simple" ? iconOption.simpleSvg : iconOption.svg

    for (const obstruction of obstructions) {
      const colour = OBSTRUCTION_COLORS[obstruction.color]
      const icon = buildIcon(svgSource, colour)
      const center = gridKeyToCenter(obstruction.gridKey)
      const marker = L.marker(center, { icon })
      marker.bindTooltip(`${obstruction.color} obstruction`)
      group.addLayer(marker)
    }

    group.addTo(map)

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, obstructions, iconOption, iconDetailMode])

  return null
}
