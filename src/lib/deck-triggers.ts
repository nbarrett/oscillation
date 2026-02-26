import proj4 from "proj4"
import { type GameBounds } from "@/lib/area-size"
import { isNearMotorway } from "@/lib/road-data"

const BNG = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs"

const BOUNDARY_THRESHOLD_M = 1000

function gridKeyToBng(gridKey: string): [number, number] {
  const [e, n] = gridKey.split("-").map(Number)
  return [e + 500, n + 500]
}

function cornersToBng(corners: GameBounds["corners"]): [number, number][] {
  return corners.map((c) => {
    const [easting, northing] = proj4("EPSG:4326", BNG, [c.lng, c.lat])
    return [easting, northing] as [number, number]
  })
}

export function isNearBoundaryEdge(
  destinationGridKey: string | null,
  gameBounds: GameBounds | null
): boolean {
  if (!gameBounds || !destinationGridKey) return false

  const bngCorners = cornersToBng(gameBounds.corners)
  const minE = Math.min(...bngCorners.map(([e]) => e))
  const maxE = Math.max(...bngCorners.map(([e]) => e))
  const minN = Math.min(...bngCorners.map(([, n]) => n))
  const maxN = Math.max(...bngCorners.map(([, n]) => n))

  const [e, n] = gridKeyToBng(destinationGridKey)
  const distToWest = e - minE
  const distToEast = maxE - e
  const distToSouth = n - minN
  const distToNorth = maxN - n

  return (
    distToWest <= BOUNDARY_THRESHOLD_M ||
    distToEast <= BOUNDARY_THRESHOLD_M ||
    distToSouth <= BOUNDARY_THRESHOLD_M ||
    distToNorth <= BOUNDARY_THRESHOLD_M
  )
}

export function isOnBoardEdge(
  gridKey: string,
  gameBounds: GameBounds | null
): boolean {
  if (!gameBounds) return false

  const bngCorners = cornersToBng(gameBounds.corners)
  const minE = Math.min(...bngCorners.map(([e]) => e))
  const maxE = Math.max(...bngCorners.map(([e]) => e))
  const minN = Math.min(...bngCorners.map(([, n]) => n))
  const maxN = Math.max(...bngCorners.map(([, n]) => n))

  const [e, n] = gridKeyToBng(gridKey)

  const gridMinE = Math.floor(minE / 1000) * 1000 + 500
  const gridMaxE = Math.floor(maxE / 1000) * 1000 + 500
  const gridMinN = Math.floor(minN / 1000) * 1000 + 500
  const gridMaxN = Math.floor(maxN / 1000) * 1000 + 500

  return e <= gridMinE || e >= gridMaxE || n <= gridMinN || n >= gridMaxN
}

export function boundaryEdge(
  gridKey: string,
  gameBounds: GameBounds
): "N" | "S" | "E" | "W" | null {
  const bngCorners = cornersToBng(gameBounds.corners)
  const minE = Math.floor(Math.min(...bngCorners.map(([e]) => e)) / 1000) * 1000 + 500
  const maxE = Math.floor(Math.max(...bngCorners.map(([e]) => e)) / 1000) * 1000 + 500
  const minN = Math.floor(Math.min(...bngCorners.map(([, n]) => n)) / 1000) * 1000 + 500
  const maxN = Math.floor(Math.max(...bngCorners.map(([, n]) => n)) / 1000) * 1000 + 500

  const [e, n] = gridKeyToBng(gridKey)

  if (n >= maxN) return "N"
  if (n <= minN) return "S"
  if (e >= maxE) return "E"
  if (e <= minE) return "W"
  return null
}

export function boundaryGridKeys(gameBounds: GameBounds): string[] {
  const bngCorners = cornersToBng(gameBounds.corners)
  const minE = Math.floor(Math.min(...bngCorners.map(([e]) => e)) / 1000) * 1000
  const maxE = Math.floor(Math.max(...bngCorners.map(([e]) => e)) / 1000) * 1000
  const minN = Math.floor(Math.min(...bngCorners.map(([, n]) => n)) / 1000) * 1000
  const maxN = Math.floor(Math.max(...bngCorners.map(([, n]) => n)) / 1000) * 1000

  const keys: string[] = []
  for (let e = minE; e <= maxE; e += 1000) keys.push(`${e}-${minN}`)
  for (let n = minN + 1000; n <= maxN; n += 1000) keys.push(`${maxE}-${n}`)
  for (let e = maxE - 1000; e >= minE; e -= 1000) keys.push(`${e}-${maxN}`)
  for (let n = maxN - 1000; n > minN; n -= 1000) keys.push(`${minE}-${n}`)

  return keys
}

export function isOnMotorwayOrRailway(
  gridKey: string,
  railwayStations?: Array<{ lat: number; lng: number }>
): { triggered: boolean; type: "motorway" | "railway" | null } {
  const [e, n] = gridKey.split("-").map(Number)
  const [lng, lat] = proj4(BNG, "EPSG:4326", [e + 500, n + 500])

  if (isNearMotorway(lat, lng)) {
    return { triggered: true, type: "motorway" }
  }

  if (railwayStations && railwayStations.length > 0) {
    for (const station of railwayStations) {
      const [sE, sN] = proj4("EPSG:4326", BNG, [station.lng, station.lat])
      const de = Math.abs(sE - (e + 500))
      const dn = Math.abs(sN - (n + 500))
      if (de <= 500 && dn <= 500) {
        return { triggered: true, type: "railway" }
      }
    }
  }

  return { triggered: false, type: null }
}

