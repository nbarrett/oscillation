"use client"

import dynamic from "next/dynamic"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { useGameStore } from "@/stores/game-store"
import { POI_CATEGORIES, POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/cn"

const CATEGORY_COLORS: Record<string, string> = {
  pub: "text-blue-600",
  spire: "text-purple-700",
  tower: "text-pink-500",
  phone: "text-yellow-600",
  school: "text-green-600",
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

export default function PoiPicker() {
  const { selectedPois, playerId, creatorPlayerId } = useGameStore()
  const isCreator = playerId !== null && playerId === creatorPlayerId
  const pickedCategories = new Set((selectedPois ?? []).map(p => p.category))

  return (
    <>
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {isCreator ? "Select one objective for each category" : "Waiting for host to select objectives..."}
              </span>
              <span className="text-xs text-muted-foreground">
                {pickedCategories.size} / {POI_CATEGORIES.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POI_CATEGORIES.map((category) => {
                const picked = pickedCategories.has(category)
                const poiForCategory = (selectedPois ?? []).find(p => p.category === category)
                const colorClass = CATEGORY_COLORS[category] ?? "text-muted-foreground"

                return (
                  <div
                    key={category}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border",
                      picked
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-card border-input"
                    )}
                  >
                    {picked ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <Circle className={cn("h-3.5 w-3.5 shrink-0", colorClass)} />
                    )}
                    <span className="font-medium">
                      {POI_CATEGORY_LABELS[category as PoiCategory] ?? category}
                    </span>
                    {picked && poiForCategory?.name && (
                      <span className="text-muted-foreground truncate max-w-[120px]">
                        — {poiForCategory.name}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[calc(100vh-280px)] min-h-[400px] relative">
            <MapWithCars />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
