"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Check, Loader2, LocateFixed } from "lucide-react"
import { useCurrentPlayer, useGameStore } from "@/stores/game-store"
import { POI_CATEGORIES, POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"
import { POI_COLOURS, PUB_ICON_OPTIONS, SPIRE_ICON_OPTIONS, TOWER_ICON_OPTIONS, PHONE_ICON_OPTIONS, SCHOOL_ICON_OPTIONS } from "@/stores/poi-icons"
import { usePubStore } from "@/stores/pub-store"
import { useSpireStore, useTowerStore } from "@/stores/church-store"
import { usePhoneStore } from "@/stores/phone-store"
import { useSchoolStore } from "@/stores/school-store"
import { usePoiSettingsStore } from "@/stores/poi-settings-store"
import { type PoiIconOption } from "@/stores/poi-types"
import { carImageForStyle } from "@/stores/car-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

const MapWithCars = dynamic(
  () => import("@/components/MapWithCars"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[75vh] w-full flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
)

function firstUnpickedCategory(pickedCategories: Set<string>): PoiCategory | null {
  return POI_CATEGORIES.find((c) => !pickedCategories.has(c)) ?? null
}

export default function PoiPicker() {
  const { selectedPois, setPlayerZoomRequest, activePickingCategory, setActivePickingCategory, players, pickingPlayerIndex } = useGameStore()
  const player = useCurrentPlayer()
  const { iconDetailMode, setIconDetailMode } = usePoiSettingsStore()
  const pubIconStyle = usePubStore((s) => s.pubIconStyle)
  const spireIconStyle = useSpireStore((s) => s.spireIconStyle)
  const towerIconStyle = useTowerStore((s) => s.towerIconStyle)
  const phoneIconStyle = usePhoneStore((s) => s.phoneIconStyle)
  const schoolIconStyle = useSchoolStore((s) => s.schoolIconStyle)
  const currentPicker = players[pickingPlayerIndex % players.length]
  const isMyPick = currentPicker?.name === player?.name
  const pickedCategories = new Set((selectedPois ?? []).map(p => p.category))
  const allPicked = pickedCategories.size === POI_CATEGORIES.length

  const activeCategory = activePickingCategory ?? firstUnpickedCategory(pickedCategories)

  const [celebration, setCelebration] = useState<{ placed: string; next: string | null } | null>(null)
  const prevPickedCountRef = useRef(pickedCategories.size)

  useEffect(() => {
    if (pickedCategories.size > prevPickedCountRef.current) {
      const lastPicked = [...pickedCategories].pop()
      const placedLabel = POI_CATEGORY_LABELS[lastPicked as PoiCategory]?.replace(/s$/, "")
      const nextCategory = firstUnpickedCategory(pickedCategories)
      const nextLabel = nextCategory ? POI_CATEGORY_LABELS[nextCategory]?.replace(/s$/, "") : null
      setCelebration({ placed: placedLabel ?? "Staging Post", next: nextLabel })
      const timer = setTimeout(() => setCelebration(null), 2000)
      prevPickedCountRef.current = pickedCategories.size
      return () => clearTimeout(timer)
    }
    prevPickedCountRef.current = pickedCategories.size
  }, [pickedCategories.size])

  const categoryIcons: Record<string, string> = useMemo(() => ({
    pub: styledSvg(resolveIcon(PUB_ICON_OPTIONS, pubIconStyle, iconDetailMode), POI_COLOURS.pub, 28),
    spire: styledSvg(resolveIcon(SPIRE_ICON_OPTIONS, spireIconStyle, iconDetailMode), POI_COLOURS.spire, 28),
    tower: styledSvg(resolveIcon(TOWER_ICON_OPTIONS, towerIconStyle, iconDetailMode), POI_COLOURS.tower, 28),
    phone: styledSvg(resolveIcon(PHONE_ICON_OPTIONS, phoneIconStyle, iconDetailMode), POI_COLOURS.phone, 28),
    school: styledSvg(resolveIcon(SCHOOL_ICON_OPTIONS, schoolIconStyle, iconDetailMode), POI_COLOURS.school, 28),
  }), [iconDetailMode, pubIconStyle, spireIconStyle, towerIconStyle, phoneIconStyle, schoolIconStyle])

  useEffect(() => {
    if (activePickingCategory && pickedCategories.has(activePickingCategory)) {
      const next = firstUnpickedCategory(pickedCategories)
      setActivePickingCategory(next)
    }
  }, [selectedPois])

  return (
    <>
      <div className="flex gap-4 items-stretch">
        {!allPicked && (
          <Card className="flex-1 basis-0 min-w-[20rem]">
            <CardContent className="p-3 space-y-1">
              <div className="text-sm font-semibold">What are Staging Posts?</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Checkpoints you must visit during the game. Place one on each type of point of interest — a pub, church spire, church tower, phone box, and school. Navigate your car along roads to visit each one and return to the start to win.
              </p>
              <div className="flex items-center justify-between gap-3 pt-1 border-t">
                {activeCategory && (
                  <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                    <span
                      className="shrink-0 flex items-center"
                      dangerouslySetInnerHTML={{ __html: categoryIcons[activeCategory] ?? "" }}
                    />
                    {isMyPick
                      ? pickedCategories.size === 0
                        ? `Tap a ${POI_CATEGORY_LABELS[activeCategory as PoiCategory]?.replace(/s$/, "")} on the map`
                        : `Now place a ${POI_CATEGORY_LABELS[activeCategory as PoiCategory]?.replace(/s$/, "")}`
                      : `${currentPicker?.name ?? "Another player"} is placing a ${POI_CATEGORY_LABELS[activeCategory as PoiCategory]?.replace(/s$/, "")}`}
                  </p>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {pickedCategories.size} of {POI_CATEGORIES.length} placed
                </span>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="flex-[3] basis-0 min-w-0">
          <CardContent className="p-3 md:p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-4 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Players:</span>
                  {players.map((p) => (
                    <button
                      key={p.name}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border bg-card hover:bg-muted/50"
                      onClick={() => setPlayerZoomRequest(p.name)}
                    >
                      <img
                        src={carImageForStyle(p.iconType)}
                        alt="car"
                        className="h-4 w-6 object-contain"
                      />
                      <span className="font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
                <div className="hidden md:block h-6 w-px bg-border" />
                <span className="text-sm font-medium whitespace-nowrap">
                  {allPicked
                    ? "All Staging Posts placed"
                    : isMyPick
                      ? "Your turn to place a Staging Post"
                      : `${currentPicker?.name ?? "Another player"}'s turn to pick`}
                </span>
                <div className="flex items-center gap-3 ml-auto shrink-0">
                  <div className="flex rounded-md border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIconDetailMode("detailed")}
                      className={cn(
                        "px-2 py-1 text-xs font-medium transition-colors",
                        iconDetailMode === "detailed"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted text-muted-foreground"
                      )}
                    >
                      Detailed
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconDetailMode("simple")}
                      className={cn(
                        "px-2 py-1 text-xs font-medium transition-colors",
                        iconDetailMode === "simple"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted text-muted-foreground"
                      )}
                    >
                      Simple
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setPlayerZoomRequest(player?.name ?? "")}
                    disabled={!player?.name}
                  >
                    <LocateFixed className="h-3.5 w-3.5" />
                    Find My Car
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {pickedCategories.size} / {POI_CATEGORIES.length}
                  </span>
                </div>
              </div>

            <div className="grid grid-cols-5 items-center w-full">
              {POI_CATEGORIES.map((category, index) => {
                const picked = pickedCategories.has(category)
                const isActive = category === activeCategory
                const colour = POI_COLOURS[category as keyof typeof POI_COLOURS]
                const isClickable = picked || isActive
                const isLast = index === POI_CATEGORIES.length - 1

                return (
                  <div key={category} className="flex items-center">
                    <button
                      type="button"
                      disabled={!isClickable}
                      onClick={() => {
                        if (picked || isActive) {
                          setActivePickingCategory(category)
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                        isActive && !picked && "bg-primary/10 ring-2 ring-primary",
                        picked && "text-primary cursor-pointer hover:bg-primary/10 opacity-60",
                        !picked && !isActive && "text-muted-foreground cursor-default opacity-40",
                      )}
                    >
                      <span
                        className="shrink-0 flex items-center"
                        dangerouslySetInnerHTML={{ __html: picked
                          ? styledSvg(resolveIcon(
                              category === "pub" ? PUB_ICON_OPTIONS
                                : category === "spire" ? SPIRE_ICON_OPTIONS
                                : category === "tower" ? TOWER_ICON_OPTIONS
                                : category === "phone" ? PHONE_ICON_OPTIONS
                                : SCHOOL_ICON_OPTIONS,
                              category === "pub" ? pubIconStyle
                                : category === "spire" ? spireIconStyle
                                : category === "tower" ? towerIconStyle
                                : category === "phone" ? phoneIconStyle
                                : schoolIconStyle,
                              iconDetailMode,
                            ), colour, 28)
                          : categoryIcons[category] ?? ""
                        }}
                      />
                      <span className="flex items-center gap-0.5">
                        {picked && <Check className="h-3 w-3 shrink-0" />}
                        {POI_CATEGORY_LABELS[category as PoiCategory]}
                      </span>
                    </button>
                    {!isLast && (
                      <div className={cn(
                        "flex-1 h-0.5 mx-0.5",
                        picked ? "bg-primary/30" : "bg-border",
                      )} />
                    )}
                  </div>
                )
              })}
            </div>

            {activeCategory && !allPicked && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span
                  className="shrink-0 flex items-center"
                  dangerouslySetInnerHTML={{ __html: categoryIcons[activeCategory] ?? "" }}
                />
                {isMyPick
                  ? `Place a Staging Post on a ${POI_CATEGORY_LABELS[activeCategory as PoiCategory]?.replace(/s$/, "")}`
                  : `${currentPicker?.name ?? "Another player"} is placing a Staging Post on a ${POI_CATEGORY_LABELS[activeCategory as PoiCategory]?.replace(/s$/, "")}`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[calc(100vh-300px)] min-h-[400px] relative">
            <MapWithCars />

            {celebration && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none animate-bounce-in">
                <div className="bg-primary/95 text-primary-foreground px-8 py-4 rounded-xl shadow-2xl text-center">
                  <div className="text-2xl font-bold">{celebration.placed} placed!</div>
                  <div className="text-sm mt-1 opacity-90">
                    {allPicked
                      ? "All staging posts placed\u2026 Game on!"
                      : celebration.next
                        ? `Now place a staging post on a ${celebration.next}`
                        : "Almost there!"}
                  </div>
                </div>
              </div>
            )}

          </div>
        </CardContent>
      </Card>
    </>
  )
}
