"use client"

import { useState } from "react"
import { Car } from "lucide-react"
import { useCarStore, CAR_SIZE_MIN, CAR_SIZE_MAX } from "@/stores/car-store"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

export default function CarSizeControl() {
  const { carSize, setCarSize } = useCarStore()
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute bottom-4 right-2 z-[1000]">
      {open && (
        <div className="mb-2 bg-background/95 backdrop-blur-sm rounded-md shadow-md border p-3 w-48">
          <div className="text-xs font-medium mb-2">Car Size</div>
          <Slider
            value={[carSize]}
            onValueChange={([value]: number[]) => setCarSize(value)}
            min={CAR_SIZE_MIN}
            max={CAR_SIZE_MAX}
            step={5}
          />
        </div>
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-md"
        onClick={() => setOpen(!open)}
      >
        <Car className="h-4 w-4" />
      </Button>
    </div>
  )
}
