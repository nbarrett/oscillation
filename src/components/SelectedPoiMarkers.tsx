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
const COLLECTED_SIZE = 56

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

function buildCollectedIcon(svgTemplate: string, colour: string): L.DivIcon {
  const poiSize = 30
  const coloured = svgTemplate
    .replace(/currentColor/g, colour)
    .replace(/<svg /, `<svg width="${poiSize}" height="${poiSize}" style="opacity:0.35;filter:grayscale(80%)" `)

  const html = `<div style="width:${COLLECTED_SIZE}px;height:${COLLECTED_SIZE}px;position:relative;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(22,163,106,0.15);border:3px solid #16a34a;box-shadow:0 0 8px rgba(22,163,106,0.4)">${coloured}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" style="position:absolute;right:-6px;top:-6px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5))"><circle cx="12" cy="12" r="11" fill="#16a34a"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`

  return L.divIcon({
    html,
    className: "collected-poi-marker",
    iconSize: [COLLECTED_SIZE, COLLECTED_SIZE],
    iconAnchor: [COLLECTED_SIZE / 2, COLLECTED_SIZE / 2],
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

  const collectedIcons = useMemo(() => ({
    pub: buildCollectedIcon(resolveIcon(PUB_ICON_OPTIONS, pubIconStyle, iconDetailMode), POI_COLOURS.pub),
    spire: buildCollectedIcon(resolveIcon(SPIRE_ICON_OPTIONS, spireIconStyle, iconDetailMode), POI_COLOURS.spire),
    tower: buildCollectedIcon(resolveIcon(TOWER_ICON_OPTIONS, towerIconStyle, iconDetailMode), POI_COLOURS.tower),
    phone: buildCollectedIcon(resolveIcon(PHONE_ICON_OPTIONS, phoneIconStyle, iconDetailMode), POI_COLOURS.phone),
    school: buildCollectedIcon(resolveIcon(SCHOOL_ICON_OPTIONS, schoolIconStyle, iconDetailMode), POI_COLOURS.school),
  }), [pubIconStyle, spireIconStyle, towerIconStyle, phoneIconStyle, schoolIconStyle, iconDetailMode])

  const visitedSet = new Set(currentPlayer?.visitedPois ?? [])

  const renderMarkers = useCallback(() => {
    if (!layerRef.current || !map) return
    layerRef.current.clearLayers()

    if (!selectedPois) return

    for (const poi of selectedPois) {
      const poiId = `${poi.category}:${poi.osmId}`
      if (isNearMotorway(poi.lat, poi.lng)) continue

      const visited = visitedSet.has(poiId)
      const icon = visited
        ? collectedIcons[poi.category as keyof typeof collectedIcons]
        : categoryIcons[poi.category as keyof typeof categoryIcons]
      if (!icon) continue

      const marker = L.marker([poi.lat, poi.lng], { icon, zIndexOffset: visited ? -100 : 0 })

      const tooltipLabel = visited ? `${poi.name ?? poi.category} ✓` : (poi.name ?? "")
      if (tooltipLabel) {
        marker.bindTooltip(tooltipLabel, { direction: "top", offset: [0, -10], className: "poi-tooltip" })
      }

      layerRef.current.addLayer(marker)
    }
  }, [map, selectedPois, visitedSet, categoryIcons, collectedIcons])

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
