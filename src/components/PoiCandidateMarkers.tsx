"use client"

import { useEffect, useRef, useCallback } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import { useGameStore } from "@/stores/game-store"
import { POI_COLOURS } from "@/stores/poi-icons"
import { trpc } from "@/lib/trpc/client"
import { isNearMotorway } from "@/lib/road-data"

const ICON_SIZE = 40
const SELECTED_ICON_SIZE = 52

function buildCandidateIcon(colour: string, size: number): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30" width="${size}" height="${size}"><path d="M12 0C6.5 0 2 4.5 2 10c0 7.4 10 18 10 18s10-10.6 10-18C22 4.5 17.5 0 12 0z" fill="${colour}"/><circle cx="12" cy="10" r="4" fill="#fff" opacity="0.8"/></svg>`
  return L.divIcon({
    html: svg,
    className: "poi-candidate-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  })
}

export default function PoiCandidateMarkers() {
  const map = useMap()
  const layerRef = useRef<L.LayerGroup | null>(null)
  const { poiCandidates, selectedPois, playerId, creatorPlayerId, sessionId } = useGameStore()
  const utils = trpc.useUtils()

  const pickPoiMutation = trpc.game.pickPoi.useMutation({
    onSuccess: () => {
      utils.game.state.invalidate()
    },
  })

  const isCreator = playerId !== null && playerId === creatorPlayerId

  const renderMarkers = useCallback(() => {
    if (!layerRef.current || !map) return
    layerRef.current.clearLayers()

    if (!poiCandidates) return

    const selectedOsmIds = new Set((selectedPois ?? []).map(p => p.osmId))
    const pickedCategories = new Set((selectedPois ?? []).map(p => p.category))
    const visibleCandidates = poiCandidates.filter(c =>
      !isNearMotorway(c.lat, c.lng) && (selectedOsmIds.has(c.osmId) || !pickedCategories.has(c.category))
    )

    for (const candidate of visibleCandidates) {
      const colour = POI_COLOURS[candidate.category as keyof typeof POI_COLOURS] ?? "#666"
      const isSelected = (selectedPois ?? []).some(p => p.osmId === candidate.osmId)
      const size = isSelected ? SELECTED_ICON_SIZE : ICON_SIZE
      const icon = buildCandidateIcon(colour, size)

      const marker = L.marker([candidate.lat, candidate.lng], { icon })

      if (candidate.name) {
        marker.bindTooltip(candidate.name)
      }

      if (isCreator && !pickPoiMutation.isPending) {
        marker.on("click", () => {
          if (!sessionId || !playerId) return
          pickPoiMutation.mutate({
            sessionId,
            playerId,
            osmId: candidate.osmId,
            category: candidate.category,
          })
        })
      }

      layerRef.current!.addLayer(marker)
    }
  }, [map, poiCandidates, selectedPois, isCreator, sessionId, playerId, pickPoiMutation])

  useEffect(() => {
    if (!map) return

    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map)
    }

    renderMarkers()

    return () => {
      if (layerRef.current) {
        layerRef.current.clearLayers()
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, renderMarkers])

  return null
}
