"use client"

import { useEffect, useRef, useCallback, useMemo } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import { useGameStore } from "@/stores/game-store"
import { POI_CATEGORIES } from "@/lib/poi-categories"
import { POI_COLOURS, PUB_ICON_OPTIONS, SPIRE_ICON_OPTIONS, TOWER_ICON_OPTIONS, PHONE_ICON_OPTIONS, SCHOOL_ICON_OPTIONS } from "@/stores/poi-icons"
import { usePubStore } from "@/stores/pub-store"
import { useSpireStore, useTowerStore } from "@/stores/church-store"
import { usePhoneStore } from "@/stores/phone-store"
import { useSchoolStore } from "@/stores/school-store"
import { usePoiSettingsStore } from "@/stores/poi-settings-store"
import { type PoiIconOption } from "@/stores/poi-types"
import { trpc } from "@/lib/trpc/client"
import { isNearMotorway } from "@/lib/road-data"

const ICON_SIZE = 40
const SELECTED_ICON_SIZE = 52

function buildStyledIcon(svgTemplate: string, colour: string, size: number): L.DivIcon {
  const coloured = svgTemplate
    .replace(/currentColor/g, colour)
    .replace(/<svg /, `<svg width="${size}" height="${size}" `)

  const pad = Math.round(size * 0.2)
  const outer = size + pad * 2
  const html = `<div style="width:${outer}px;height:${outer}px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.85);border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid ${colour}">${coloured}</div>`

  return L.divIcon({
    html,
    className: "poi-candidate-icon",
    iconSize: [outer, outer],
    iconAnchor: [outer / 2, outer / 2],
  })
}

function resolveIcon<T extends string>(
  options: PoiIconOption<T>[],
  style: T,
  detailMode: string,
): string {
  const option = options.find((o) => o.style === style) ?? options[0]!
  return detailMode === "simple" ? option.simpleSvg : option.svg
}

export default function PoiCandidateMarkers() {
  const map = useMap()
  const layerRef = useRef<L.LayerGroup | null>(null)
  const { poiCandidates, selectedPois, playerId, creatorPlayerId, sessionId, activePickingCategory } = useGameStore()
  const utils = trpc.useUtils()

  const pubIconStyle = usePubStore((s) => s.pubIconStyle)
  const spireIconStyle = useSpireStore((s) => s.spireIconStyle)
  const towerIconStyle = useTowerStore((s) => s.towerIconStyle)
  const phoneIconStyle = usePhoneStore((s) => s.phoneIconStyle)
  const schoolIconStyle = useSchoolStore((s) => s.schoolIconStyle)
  const iconDetailMode = usePoiSettingsStore((s) => s.iconDetailMode)

  const categoryIcons = useMemo(() => ({
    pub: { svg: resolveIcon(PUB_ICON_OPTIONS, pubIconStyle, iconDetailMode), colour: POI_COLOURS.pub },
    spire: { svg: resolveIcon(SPIRE_ICON_OPTIONS, spireIconStyle, iconDetailMode), colour: POI_COLOURS.spire },
    tower: { svg: resolveIcon(TOWER_ICON_OPTIONS, towerIconStyle, iconDetailMode), colour: POI_COLOURS.tower },
    phone: { svg: resolveIcon(PHONE_ICON_OPTIONS, phoneIconStyle, iconDetailMode), colour: POI_COLOURS.phone },
    school: { svg: resolveIcon(SCHOOL_ICON_OPTIONS, schoolIconStyle, iconDetailMode), colour: POI_COLOURS.school },
  }), [pubIconStyle, spireIconStyle, towerIconStyle, phoneIconStyle, schoolIconStyle, iconDetailMode])

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
    const effectiveCategory = activePickingCategory ?? POI_CATEGORIES.find((c) => !pickedCategories.has(c)) ?? null
    const visibleCandidates = poiCandidates.filter(c =>
      !isNearMotorway(c.lat, c.lng) && (selectedOsmIds.has(c.osmId) || c.category === effectiveCategory)
    )

    for (const candidate of visibleCandidates) {
      const isSelected = selectedOsmIds.has(candidate.osmId)
      const size = isSelected ? SELECTED_ICON_SIZE : ICON_SIZE
      const iconData = categoryIcons[candidate.category as keyof typeof categoryIcons]

      if (!iconData) continue

      const icon = buildStyledIcon(iconData.svg, iconData.colour, size)
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
  }, [map, poiCandidates, selectedPois, isCreator, sessionId, playerId, pickPoiMutation, activePickingCategory, categoryIcons])

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
