"use client"

import { useEffect } from "react"
import { useGameStore } from "@/stores/game-store"
import { asTitle, log } from "@/lib/utils"

export default function GridReferences() {
  const mapClickPosition = useGameStore((state) => state.mapClickPosition)
  const gridReferenceData = mapClickPosition?.gridReferenceData
  const gridSquareCorners = mapClickPosition?.gridSquareCorners
  const cornerPairs = gridSquareCorners ? Object.entries(gridSquareCorners) : null

  useEffect(() => {
    log.info("gridReferenceData:", gridReferenceData, "cornerPairs:", cornerPairs)
  }, [cornerPairs, gridReferenceData])

  if (!cornerPairs) return null

  return (
    <>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Grid Reference</p>
        <p className="font-medium">{gridReferenceData?.gridReference}</p>
      </div>
      {cornerPairs.map((cornerPair) => (
        <div key={cornerPair[0]} className="space-y-1">
          <p className="text-xs text-muted-foreground">{asTitle(cornerPair[0])}</p>
          <p className="font-medium">{cornerPair[1]}</p>
        </div>
      ))}
    </>
  )
}
