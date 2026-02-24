"use client"

import { useEffect, useRef, useCallback, useMemo } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import { useGameStore, useCurrentPlayer } from "@/stores/game-store"
import { POI_COLOURS, PUB_ICON_OPTIONS, SPIRE_ICON_OPTIONS, TOWER_ICON_OPTIONS, PHONE_ICON_OPTIONS, SCHOOL_ICON_OPTIONS } from "@/stores/poi-icons"
import { usePubStore } from "@/stores/pub-store"
import { useSpireStore, useTowerStore } from "@/stores/church-store"
import { usePhoneStore } from "@/stores/phone-store"
import { useSchoolStore } from "@/stores/school-store"
import { usePoiSettingsStore } from "@/stores/poi-settings-store"
import { type PoiIconOption } from "@/stores/poi-types"
import { isNearMotorway } from "@/lib/road-data"

const ICON_SIZE = 52

function buildIcon(svgTemplate: string, colour: string): L.DivIcon {
  const coloured = svgTemplate
    .replace(/currentColor/g, colour)
    .replace(/<svg /, `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" `)

  return L.divIcon({
    html: coloured,
    className: "selected-poi-icon",
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
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

export default function SelectedPoiMarkers() {
  const map = useMap()
  const layerRef = useRef<L.LayerGroup | null>(null)
  const { selectedPois } = useGameStore()
  const currentPlayer = useCurrentPlayer()

  const pubIconStyle = usePubStore((s) => s.pubIconStyle)
  const spireIconStyle = useSpireStore((s) => s.spireIconStyle)
  const towerIconStyle = useTowerStore((s) => s.towerIconStyle)
  const phoneIconStyle = usePhoneStore((s) => s.phoneIconStyle)
  const schoolIconStyle = useSchoolStore((s) => s.schoolIconStyle)
  const iconDetailMode = usePoiSettingsStore((s) => s.iconDetailMode)

  const categoryIcons = useMemo(() => ({
    pub: buildIcon(resolveIcon(PUB_ICON_OPTIONS, pubIconStyle, iconDetailMode), POI_COLOURS.pub),
    spire: buildIcon(resolveIcon(SPIRE_ICON_OPTIONS, spireIconStyle, iconDetailMode), POI_COLOURS.spire),
    tower: buildIcon(resolveIcon(TOWER_ICON_OPTIONS, towerIconStyle, iconDetailMode), POI_COLOURS.tower),
    phone: buildIcon(resolveIcon(PHONE_ICON_OPTIONS, phoneIconStyle, iconDetailMode), POI_COLOURS.phone),
    school: buildIcon(resolveIcon(SCHOOL_ICON_OPTIONS, schoolIconStyle, iconDetailMode), POI_COLOURS.school),
  }), [pubIconStyle, spireIconStyle, towerIconStyle, phoneIconStyle, schoolIconStyle, iconDetailMode])

  const visitedSet = new Set(currentPlayer?.visitedPois ?? [])

  const renderMarkers = useCallback(() => {
    if (!layerRef.current || !map) return
    layerRef.current.clearLayers()

    if (!selectedPois) return

    for (const poi of selectedPois) {
      const poiId = `${poi.category}:${poi.osmId}`
      if (visitedSet.has(poiId)) continue
      if (isNearMotorway(poi.lat, poi.lng)) continue

      const icon = categoryIcons[poi.category as keyof typeof categoryIcons]
      if (!icon) continue

      const marker = L.marker([poi.lat, poi.lng], { icon })

      if (poi.name) {
        marker.bindTooltip(poi.name)
      }

      layerRef.current.addLayer(marker)
    }
  }, [map, selectedPois, visitedSet, categoryIcons])

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
