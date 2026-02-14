"use client"

import { useCarStore, CAR_ICON_OPTIONS, CAR_SIZE_MIN, CAR_SIZE_MAX, type CarStyle } from "@/stores/car-store"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function CarIconSelector() {
  const { preferredCar, setPreferredCar, carSize, setCarSize } = useCarStore()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Choose Your Car</Label>
        <div className="flex flex-wrap gap-2">
          {CAR_ICON_OPTIONS.map((option) => (
            <Tooltip key={option.style}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setPreferredCar(option.style as CarStyle)}
                  className={cn(
                    "flex items-center justify-center w-16 h-10 rounded-md border-2 transition-all hover:scale-110 overflow-hidden p-1",
                    preferredCar === option.style
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-muted bg-background hover:border-muted-foreground/30"
                  )}
                >
                  <img
                    src={option.image}
                    alt={option.label}
                    className="w-full h-full object-contain"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>{option.label}</TooltipContent>
            </Tooltip>
          ))}
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
          <span className="text-sm text-muted-foreground w-8 text-right">{carSize}</span>
        </div>
      </div>
    </div>
  )
}
