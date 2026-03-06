"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useMap } from "react-leaflet"
import { useGameStore, useCurrentPlayer, type SelectedPoi } from "@/stores/game-store"
import { POI_COLOURS, PUB_ICON_OPTIONS, SPIRE_ICON_OPTIONS, TOWER_ICON_OPTIONS, PHONE_ICON_OPTIONS, SCHOOL_ICON_OPTIONS } from "@/stores/poi-icons"
import { usePubStore } from "@/stores/pub-store"
import { useSpireStore, useTowerStore } from "@/stores/church-store"
import { usePhoneStore } from "@/stores/phone-store"
import { useSchoolStore } from "@/stores/school-store"
import { usePoiSettingsStore } from "@/stores/poi-settings-store"
import { type PoiIconOption } from "@/stores/poi-types"

const EDGE_PADDING = 50
const INDICATOR_SIZE = 40
const ARROW_SIZE = 10

function resolveSvg<T extends string>(options: PoiIconOption<T>[], style: T, detailMode: string): string {
  const option = options.find((o) => o.style === style) ?? options[0]!
  return detailMode === "simple" ? option.simpleSvg : option.svg
}

interface ArrowIndicator {
  poi: SelectedPoi
  x: number
  y: number
  angle: number
  colour: string
  svgHtml: string
  isSimple: boolean
}

function categoryColour(category: string): string {
  return POI_COLOURS[category as keyof typeof POI_COLOURS] ?? "#888"
}

export default function ObjectiveArrows() {
  const map = useMap()
  const { selectedPois, phase } = useGameStore()
  const currentPlayer = useCurrentPlayer()
  const [indicators, setIndicators] = useState<ArrowIndicator[]>([])

  const pubIconStyle = usePubStore((s) => s.pubIconStyle)
  const spireIconStyle = useSpireStore((s) => s.spireIconStyle)
  const towerIconStyle = useTowerStore((s) => s.towerIconStyle)
  const phoneIconStyle = usePhoneStore((s) => s.phoneIconStyle)
  const schoolIconStyle = useSchoolStore((s) => s.schoolIconStyle)
  const iconDetailMode = usePoiSettingsStore((s) => s.iconDetailMode)

  const categorySvgs = useMemo(() => ({
    pub: resolveSvg(PUB_ICON_OPTIONS, pubIconStyle, iconDetailMode),
    spire: resolveSvg(SPIRE_ICON_OPTIONS, spireIconStyle, iconDetailMode),
    tower: resolveSvg(TOWER_ICON_OPTIONS, towerIconStyle, iconDetailMode),
    phone: resolveSvg(PHONE_ICON_OPTIONS, phoneIconStyle, iconDetailMode),
    school: resolveSvg(SCHOOL_ICON_OPTIONS, schoolIconStyle, iconDetailMode),
  }), [pubIconStyle, spireIconStyle, towerIconStyle, phoneIconStyle, schoolIconStyle, iconDetailMode])

  const visitedSet = useMemo(
    () => new Set(currentPlayer?.visitedPois ?? []),
    [currentPlayer?.visitedPois]
  )

  const unvisitedPois = useMemo(() => {
    if (!selectedPois) return []
    return selectedPois.filter(
      (poi) => !visitedSet.has(`${poi.category}:${poi.osmId}`)
    )
  }, [selectedPois, visitedSet])

  const updateIndicators = useCallback(() => {
    if (!map || unvisitedPois.length === 0) {
      setIndicators([])
      return
    }

    const bounds = map.getBounds()
    const container = map.getContainer()
    const width = container.clientWidth
    const height = container.clientHeight

    const arrows: ArrowIndicator[] = []

    for (const poi of unvisitedPois) {
      if (bounds.contains([poi.lat, poi.lng])) continue

      const point = map.latLngToContainerPoint([poi.lat, poi.lng])

      const cx = width / 2
      const cy = height / 2
      const dx = point.x - cx
      const dy = point.y - cy
      const angle = Math.atan2(dy, dx)

      const minX = EDGE_PADDING
      const maxX = width - EDGE_PADDING
      const minY = EDGE_PADDING
      const maxY = height - EDGE_PADDING

      let x = point.x
      let y = point.y

      const scaleX = dx > 0
        ? (maxX - cx) / dx
        : dx < 0
          ? (minX - cx) / dx
          : Infinity
      const scaleY = dy > 0
        ? (maxY - cy) / dy
        : dy < 0
          ? (minY - cy) / dy
          : Infinity
      const scale = Math.min(scaleX, scaleY)

      if (scale < 1) {
        x = cx + dx * scale
        y = cy + dy * scale
      }

      x = Math.max(minX, Math.min(maxX, x))
      y = Math.max(minY, Math.min(maxY, y))

      const colour = categoryColour(poi.category)
      const svgTemplate = categorySvgs[poi.category as keyof typeof categorySvgs] ?? ""
      const isSimple = iconDetailMode === "simple"
      const svgHtml = isSimple ? svgTemplate.replace(/currentColor/g, "#fff") : svgTemplate

      arrows.push({ poi, x, y, angle, colour, svgHtml, isSimple })
    }

    setIndicators(arrows)
  }, [map, unvisitedPois, categorySvgs])

  useEffect(() => {
    if (!map) return

    updateIndicators()
    map.on("move", updateIndicators)
    map.on("zoom", updateIndicators)
    map.on("resize", updateIndicators)

    return () => {
      map.off("move", updateIndicators)
      map.off("zoom", updateIndicators)
      map.off("resize", updateIndicators)
    }
  }, [map, updateIndicators])

  if (phase !== "playing" || indicators.length === 0) return null

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      {indicators.map((ind) => {
        const angleDeg = (ind.angle * 180) / Math.PI

        return (
          <div
            key={`${ind.poi.category}:${ind.poi.osmId}`}
            style={{
              position: "absolute",
              left: ind.x - INDICATOR_SIZE / 2,
              top: ind.y - INDICATOR_SIZE / 2,
              width: INDICATOR_SIZE,
              height: INDICATOR_SIZE,
            }}
          >
            <div
              style={{
                width: INDICATOR_SIZE,
                height: INDICATOR_SIZE,
                borderRadius: "50%",
                backgroundColor: ind.isSimple ? ind.colour : "#fff",
                border: ind.isSimple ? "2px solid #fff" : "2px solid #ccc",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
              dangerouslySetInnerHTML={{
                __html: ind.svgHtml
                  .replace(/<svg /, `<svg width="${ind.isSimple ? INDICATOR_SIZE - 12 : INDICATOR_SIZE - 6}" height="${ind.isSimple ? INDICATOR_SIZE - 12 : INDICATOR_SIZE - 6}" `),
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `rotate(${angleDeg}deg) translate(${INDICATOR_SIZE / 2 + ARROW_SIZE - 2}px, 0) rotate(90deg)`,
                transformOrigin: "0 0",
              }}
            >
              <svg width={ARROW_SIZE * 2} height={ARROW_SIZE * 2} viewBox="0 0 20 20" style={{ marginLeft: -ARROW_SIZE, marginTop: -ARROW_SIZE }}>
                <polygon
                  points="10,2 18,18 10,14 2,18"
                  fill={ind.colour}
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )
      })}
    </div>
  )
}
