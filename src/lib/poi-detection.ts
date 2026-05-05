import { latLngToGridKey, gridKeyToLatLng } from "@/lib/road-data"
import type { PoiItem } from "@/stores/poi-types"

export interface PoiVisit {
  id: string;
  category: string;
  name: string | null;
}

const COLLECTION_RADIUS_METRES = 1500

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function detectPoiVisits(
  destinationGridKey: string,
  pubs: PoiItem[],
  spires: PoiItem[],
  towers: PoiItem[],
  phones: PoiItem[],
  schools: PoiItem[],
  selectedPois: Array<{ category: string; osmId: number }> | null,
  movementPath?: string[],
): PoiVisit[] {
  if (!selectedPois || selectedPois.length === 0) return []

  const selectedSet = new Set(selectedPois.map(p => `${p.category}:${p.osmId}`))
  const visits: PoiVisit[] = []
  const visitedIds = new Set<string>()

  const playerPositions: Array<[number, number]> = []
  playerPositions.push(gridKeyToLatLng(destinationGridKey))
  if (movementPath) {
    for (const key of movementPath) {
      playerPositions.push(gridKeyToLatLng(key))
    }
  }

  const allPois: Array<{ category: string; items: PoiItem[] }> = [
    { category: "pub", items: pubs },
    { category: "spire", items: spires },
    { category: "tower", items: towers },
    { category: "phone", items: phones },
    { category: "school", items: schools },
  ]

  for (const { category, items } of allPois) {
    for (const poi of items) {
      const poiId = `${category}:${poi.id}`
      if (!selectedSet.has(poiId)) continue
      if (visitedIds.has(poiId)) continue

      for (const [lat, lng] of playerPositions) {
        if (haversineMetres(lat, lng, poi.lat, poi.lng) <= COLLECTION_RADIUS_METRES) {
          visits.push({ id: poiId, category, name: poi.name })
          visitedIds.add(poiId)
          break
        }
      }
    }
  }

  return visits
}
