"use client"

import { useCarStore, CAR_ICON_OPTIONS, CAR_SIZE_MIN, CAR_SIZE_MAX, type CarStyle } from "@/stores/car-store"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function CarIconSelector({ takenCars = [] }: { takenCars?: string[] }) {
  const { preferredCar, setPreferredCar, carSize, setCarSize } = useCarStore()
  const takenSet = new Set(takenCars)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Choose Your Car</Label>
        <div className="flex flex-wrap gap-2">
          {CAR_ICON_OPTIONS.map((option) => {
            const isTaken = takenSet.has(option.style)
            return (
              <Tooltip key={option.style}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !isTaken && setPreferredCar(option.style as CarStyle)}
                    disabled={isTaken}
                    className={cn(
                      "flex items-center justify-center w-16 h-10 rounded-md border-2 transition-all overflow-hidden p-1",
                      isTaken
                        ? "border-muted bg-muted opacity-30 cursor-not-allowed"
                        : preferredCar === option.style
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-muted bg-background hover:border-muted-foreground/30 hover:scale-110"
                    )}
                  >
                    <img
                      src={option.image}
                      alt={option.label}
                      className="w-full h-full object-contain"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isTaken ? `${option.label} (taken)` : option.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Car Size</Label>
        <div className="flex items-center gap-3">
          <Slider
            value={[carSize]}
            onValueChange={([value]: number[]) => setCarSize(value)}
            min={CAR_SIZE_MIN}
            max={CAR_SIZE_MAX}
            step={10}
            className="flex-1"
          />
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: "120px", height: "80px" }}
          >
            <img
              src={CAR_ICON_OPTIONS.find((o) => o.style === preferredCar)?.image ?? CAR_ICON_OPTIONS[0].image}
              alt="Car preview"
              className="object-contain"
              style={{ width: `${carSize}px` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
