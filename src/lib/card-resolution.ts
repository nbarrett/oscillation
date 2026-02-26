import proj4 from "proj4"
import { type GameBounds } from "@/lib/area-size"
import { type EdgeCard, type MotorwayCard, type Ordinal } from "@/lib/card-decks"
import { boundaryGridKeys, boundaryEdge } from "@/lib/deck-triggers"
import { gridHasARoad, gridHasBRoad, motorwayJunctions, railwayStations, latLngToGridKey } from "@/lib/road-data"

const BNG = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs"

export function ordinalToNumber(ordinal: Ordinal): number {
  switch (ordinal) {
    case "1st": return 1
    case "2nd": return 2
    case "3rd": return 3
  }
}

function gridKeyCenter(gridKey: string): [number, number] {
  const [e, n] = gridKey.split("-").map(Number)
  return [e + 500, n + 500]
}

export function resolveEdgeCard(
  card: EdgeCard,
  triggerGridKey: string,
  gameBounds: GameBounds
): string | null {
  const allBoundary = boundaryGridKeys(gameBounds)
  if (allBoundary.length === 0) return null

  const triggerIndex = allBoundary.indexOf(triggerGridKey)

  let ordered: string[]
  if (triggerIndex === -1) {
    const edge = boundaryEdge(triggerGridKey, gameBounds)
    if (!edge) return null

    const [tE, tN] = gridKeyCenter(triggerGridKey)
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < allBoundary.length; i++) {
      const [bE, bN] = gridKeyCenter(allBoundary[i])
      const dist = Math.abs(bE - tE) + Math.abs(bN - tN)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    ordered = [...allBoundary.slice(bestIdx + 1), ...allBoundary.slice(0, bestIdx)]
  } else {
    if (card.direction === "clockwise") {
      ordered = [...allBoundary.slice(triggerIndex + 1), ...allBoundary.slice(0, triggerIndex)]
    } else {
      const reversed = [...allBoundary].reverse()
      const revIndex = reversed.indexOf(triggerGridKey)
      ordered = [...reversed.slice(revIndex + 1), ...reversed.slice(0, revIndex)]
    }
  }

  const checker = card.roadType === "A" ? gridHasARoad : gridHasBRoad
  const target = ordinalToNumber(card.ordinal)
  let count = 0

  for (const key of ordered) {
    if (checker(key)) {
      count++
      if (count === target) return key
    }
  }

  return null
}

function bearingBetween(e1: number, n1: number, e2: number, n2: number): number {
  const dE = e2 - e1
  const dN = n2 - n1
  const rad = Math.atan2(dE, dN)
  return ((rad * 180) / Math.PI + 360) % 360
}

function compassToBearing(compass: string): number {
  const map: Record<string, number> = {
    N: 0, NE: 45, E: 90, SE: 135,
    S: 180, SW: 225, W: 270, NW: 315,
  }
  return map[compass] ?? 0
}

function angleDifference(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360
  if (diff > 180) diff = 360 - diff
  return diff
}

export function resolveMotorwayCard(
  card: MotorwayCard,
  triggerGridKey: string
): string | null {
  const [tE, tN] = gridKeyCenter(triggerGridKey)
  const targetBearing = compassToBearing(card.compass)
  const target = ordinalToNumber(card.ordinal)

  const points = card.infrastructure === "motorway junction"
    ? motorwayJunctions().map((j) => {
        const [jE, jN] = proj4("EPSG:4326", BNG, [j.lng, j.lat])
        return { easting: jE, northing: jN }
      })
    : railwayStations().map((s) => {
        const [sE, sN] = proj4("EPSG:4326", BNG, [s.lng, s.lat])
        return { easting: sE, northing: sN }
      })

  const candidates = points
    .map((p) => {
      const bearing = bearingBetween(tE, tN, p.easting, p.northing)
      const diff = angleDifference(bearing, targetBearing)
      const dist = Math.sqrt((p.easting - tE) ** 2 + (p.northing - tN) ** 2)
      return { ...p, bearing, diff, dist }
    })
    .filter((p) => p.diff <= 45 && p.dist > 500)
    .sort((a, b) => a.dist - b.dist)

  if (candidates.length < target) return null

  const chosen = candidates[target - 1]
  const [lng, lat] = proj4(BNG, "EPSG:4326", [chosen.easting, chosen.northing])
  return latLngToGridKey(lat, lng)
}
