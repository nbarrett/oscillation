"use client"

import { Gamepad2, Car } from "lucide-react"

function MapImageBackground() {
  return (
    <div className="absolute inset-0">
      <img
        src="/map-preview.png"
        alt="OS Map"
        className="w-full h-full object-cover"
      />
    </div>
  )
}

function CarMarker({ position, color, rotation = 0 }: { position: string; color: string; rotation?: number }) {
  return (
    <div
      className={`absolute ${position} w-8 h-8 ${color} rounded-full border-2 border-white shadow-lg flex items-center justify-center`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Car className="h-4 w-4 text-white" />
    </div>
  )
}

function GameplayPreviewMarkers() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <CarMarker position="top-8 left-[15%]" color="bg-red-500" rotation={45} />
      <CarMarker position="top-20 left-[60%]" color="bg-blue-500" rotation={-30} />
      <CarMarker position="top-14 right-[20%]" color="bg-green-500" rotation={15} />
      <CarMarker position="top-28 left-[40%]" color="bg-amber-500" rotation={-45} />

      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <path
          d="M 70 45 Q 150 90 250 70 T 380 100"
          stroke="white"
          strokeWidth="3"
          strokeDasharray="8 6"
          fill="none"
          opacity="0.9"
          strokeLinecap="round"
        />
        <path
          d="M 100 120 Q 200 80 320 110"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeDasharray="6 4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function BrandingOverlay() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-4 pt-16 bg-gradient-to-t from-card via-card/70 to-transparent">
      <div className="flex items-center gap-4 mb-2">
        <a href="https://labs.os.uk" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
          <div className="h-10 w-[80px] bg-white rounded p-1 shadow-md">
            <img src="https://labs.os.uk/static/media/os-logo.svg" alt="Ordnance Survey" className="h-full w-full object-contain" />
          </div>
        </a>
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-primary">Oscillation</h1>
        </div>
      </div>
      <p className="text-base text-muted-foreground">Every OS map is a game waiting to be played</p>
    </div>
  )
}

export function MapPreviewHeader({ height = "h-80" }: { height?: string }) {
  return (
    <div className={`relative ${height} bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden`}>
      <MapImageBackground />
      <GameplayPreviewMarkers />
      <BrandingOverlay />
    </div>
  )
}
