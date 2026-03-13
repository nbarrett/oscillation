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

function buildBaseIcon(svgTemplate: string, colour: string, dimmed = false): string {
  const hex = dimmed ? "#9ca3af" : colour
  return svgTemplate
    .replace(/currentColor/g, hex)
    .replace(/<svg /, `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" opacity="${dimmed ? 0.45 : 1}" `)
}

function buildMarkerHtml(iconSvg: string, label: string, style: "normal" | "depleted" | "collected"): string {
  const badgeBg =
    style === "collected" ? "#16a34a" :
    style === "depleted" ? "#6b7280" :
    "#2563eb"

  return `
    <div style="position:relative;width:${ICON_SIZE}px;height:${ICON_SIZE}px;">
      ${iconSvg}
      <div style="position:absolute;top:-4px;right:-4px;background:${badgeBg};color:white;border-radius:9999px;min-width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;padding:0 3px;border:2px solid white;">
        ${label}
      </div>
    </div>
  `
}

function buildIcon(html: string): L.DivIcon {
  return L.divIcon({
    html,
    className: "selected-poi-icon",
    iconSize: [ICON_SIZE + 8, ICON_SIZE + 8],
    iconAnchor: [(ICON_SIZE + 8) / 2, (ICON_SIZE + 8) / 2],
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
  const { selectedPois, tokenInventory } = useGameStore()
  const currentPlayer = useCurrentPlayer()

  const pubIconStyle = usePubStore((s) => s.pubIconStyle)
  const spireIconStyle = useSpireStore((s) => s.spireIconStyle)
  const towerIconStyle = useTowerStore((s) => s.towerIconStyle)
  const phoneIconStyle = usePhoneStore((s) => s.phoneIconStyle)
  const schoolIconStyle = useSchoolStore((s) => s.schoolIconStyle)
  const iconDetailMode = usePoiSettingsStore((s) => s.iconDetailMode)

  const categoryIconSvgs = useMemo(() => ({
    pub: resolveIcon(PUB_ICON_OPTIONS, pubIconStyle, iconDetailMode),
    spire: resolveIcon(SPIRE_ICON_OPTIONS, spireIconStyle, iconDetailMode),
    tower: resolveIcon(TOWER_ICON_OPTIONS, towerIconStyle, iconDetailMode),
    phone: resolveIcon(PHONE_ICON_OPTIONS, phoneIconStyle, iconDetailMode),
    school: resolveIcon(SCHOOL_ICON_OPTIONS, schoolIconStyle, iconDetailMode),
  }), [pubIconStyle, spireIconStyle, towerIconStyle, phoneIconStyle, schoolIconStyle, iconDetailMode])

  const visitedPois = currentPlayer?.visitedPois ?? []
  const visitedSet = useMemo(() => new Set(visitedPois), [visitedPois.join(",")])

  const renderMarkers = useCallback(() => {
    if (!layerRef.current || !map) return
    layerRef.current.clearLayers()

    if (!selectedPois) return

    for (const poi of selectedPois) {
      const poiId = `${poi.category}:${poi.osmId}`
      if (isNearMotorway(poi.lat, poi.lng)) continue

      const svgTemplate = categoryIconSvgs[poi.category as keyof typeof categoryIconSvgs]
      if (!svgTemplate) continue

      const colour = POI_COLOURS[poi.category as keyof typeof POI_COLOURS] ?? "#374151"
      const remaining = tokenInventory[poiId] ?? null
      const visited = visitedSet.has(poiId)
      const depleted = remaining !== null && remaining === 0

      let style: "normal" | "depleted" | "collected"
      let badgeLabel: string

      if (visited) {
        style = "collected"
        badgeLabel = "✓"
      } else if (depleted) {
        style = "depleted"
        badgeLabel = "0"
      } else {
        style = "normal"
        badgeLabel = remaining !== null ? String(remaining) : "?"
      }

      const iconSvg = buildBaseIcon(svgTemplate, colour, depleted && !visited)
      const html = buildMarkerHtml(iconSvg, badgeLabel, style)
      const icon = buildIcon(html)

      const marker = L.marker([poi.lat, poi.lng], { icon, zIndexOffset: visited ? -100 : 0 })

      const tooltipParts = [poi.name ?? poi.category]
      if (visited) tooltipParts.push("Collected ✓")
      else if (depleted) tooltipParts.push("Depleted — no tokens left")
      else if (remaining !== null) tooltipParts.push(`${remaining} token${remaining === 1 ? "" : "s"} remaining`)
      marker.bindTooltip(tooltipParts.join(" · "), { direction: "top", offset: [0, -10], className: "poi-tooltip" })

      layerRef.current.addLayer(marker)
    }
  }, [map, selectedPois, visitedSet, categoryIconSvgs, tokenInventory])

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
