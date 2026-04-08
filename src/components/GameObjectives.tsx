"use client"

import { useMemo } from "react"
import { Circle, CheckCircle2, MapPin, LocateFixed } from "lucide-react"
import { useGameStore } from "@/stores/game-store"
import { POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"
import { POI_COLOURS, PUB_ICON_OPTIONS, SPIRE_ICON_OPTIONS, TOWER_ICON_OPTIONS, PHONE_ICON_OPTIONS, SCHOOL_ICON_OPTIONS } from "@/stores/poi-icons"
import { latLngToGridKey } from "@/lib/road-data"
import { usePubStore } from "@/stores/pub-store"
import { useSpireStore, useTowerStore } from "@/stores/church-store"
import { usePhoneStore } from "@/stores/phone-store"
import { useSchoolStore } from "@/stores/school-store"
import { usePoiSettingsStore } from "@/stores/poi-settings-store"
import { type PoiIconOption } from "@/stores/poi-types"
import { cn } from "@/lib/cn"


function resolveIcon<T extends string>(
  options: PoiIconOption<T>[],
  style: T,
  detailMode: string,
): string {
  const option = options.find((o) => o.style === style) ?? options[0]!
  return detailMode === "simple" ? option.simpleSvg : option.svg
}

function styledSvg(svgTemplate: string, colour: string, size: number): string {
  return svgTemplate
    .replace(/currentColor/g, colour)
    .replace(/<svg /, `<svg width="${size}" height="${size}" `)
}

export default function GameObjectives() {
  const { selectedPois, players, localPlayerName } = useGameStore()
  const pubIconStyle = usePubStore((s) => s.pubIconStyle)
  const spireIconStyle = useSpireStore((s) => s.spireIconStyle)
  const towerIconStyle = useTowerStore((s) => s.towerIconStyle)
  const phoneIconStyle = usePhoneStore((s) => s.phoneIconStyle)
  const schoolIconStyle = useSchoolStore((s) => s.schoolIconStyle)
  const { iconDetailMode } = usePoiSettingsStore()

  const categoryIcons: Record<string, string> = useMemo(() => ({
    pub: styledSvg(resolveIcon(PUB_ICON_OPTIONS, pubIconStyle, iconDetailMode), POI_COLOURS.pub, 14),
    spire: styledSvg(resolveIcon(SPIRE_ICON_OPTIONS, spireIconStyle, iconDetailMode), POI_COLOURS.spire, 14),
    tower: styledSvg(resolveIcon(TOWER_ICON_OPTIONS, towerIconStyle, iconDetailMode), POI_COLOURS.tower, 14),
    phone: styledSvg(resolveIcon(PHONE_ICON_OPTIONS, phoneIconStyle, iconDetailMode), POI_COLOURS.phone, 14),
    school: styledSvg(resolveIcon(SCHOOL_ICON_OPTIONS, schoolIconStyle, iconDetailMode), POI_COLOURS.school, 14),
  }), [iconDetailMode, pubIconStyle, spireIconStyle, towerIconStyle, phoneIconStyle, schoolIconStyle])

  if (!selectedPois || selectedPois.length === 0) return null

  const localPlayer = players.find(p => p.name === localPlayerName)
  const visitedSet = new Set(localPlayer?.visitedPois ?? [])
  const playerGridKey = localPlayer ? latLngToGridKey(localPlayer.position[0], localPlayer.position[1]) : null
  const allVisited = selectedPois.every(poi => visitedSet.has(`${poi.category}:${poi.osmId}`))

  return (
    <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap shrink-0">
        Staging Posts:
      </span>
        {selectedPois.map((poi) => {
          const poiId = `${poi.category}:${poi.osmId}`
          const visited = visitedSet.has(poiId)
          const poiGridKey = latLngToGridKey(poi.lat, poi.lng)
          const nearby = !visited && playerGridKey === poiGridKey
          const colour = POI_COLOURS[poi.category as keyof typeof POI_COLOURS]

          return (
            <div
              key={poiId}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-card border-input shrink-0",
                nearby && "border-amber-400 animate-pulse",
              )}
            >
              <span
                className="shrink-0 flex items-center w-3.5 h-3.5 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: categoryIcons[poi.category] ?? "" }}
              />
              <span className="font-medium">
                {POI_CATEGORY_LABELS[poi.category as PoiCategory] ?? poi.category}
              </span>
              {visited ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: colour }} />
              ) : nearby ? (
                <LocateFixed className="h-4 w-4 shrink-0 text-amber-400" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
            </div>
          )
        })}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border",
            localPlayer?.hasReturnedToStart
              ? "bg-primary/10 border-primary/30 text-primary"
              : allVisited
                ? "bg-card border-input animate-pulse"
                : "bg-card border-input opacity-50"
          )}
        >
          {localPlayer?.hasReturnedToStart ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
          ) : (
            <MapPin className={cn("h-3.5 w-3.5 shrink-0", allVisited ? "text-orange-500" : "text-muted-foreground")} />
          )}
          <span className={cn("font-medium", localPlayer?.hasReturnedToStart && "line-through opacity-70")}>
            Return to start
          </span>
        </div>
    </div>
  )
}
