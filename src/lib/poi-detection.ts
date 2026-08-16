import { latLngToGridKey, gridKeyToLatLng } from "@/lib/road-data"
import type { PoiItem } from "@/stores/poi-types"

export interface PoiVisit {
  id: string;
  category: string;
  name: string | null;
}

const COLLECTION_RADIUS_METRES = 1000

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

type SelectedPoiInput = {
  category: string
  osmId: number
  name?: string | null
  lat?: number
  lng?: number
}

const STORE_BY_CATEGORY: Record<string, number> = {
  pub: 0,
  spire: 1,
  tower: 2,
  phone: 3,
  school: 4,
}

export function detectPoiVisits(
  destinationGridKey: string,
  pubs: PoiItem[],
  spires: PoiItem[],
  towers: PoiItem[],
  phones: PoiItem[],
  schools: PoiItem[],
  selectedPois: SelectedPoiInput[] | null,
  movementPath?: string[],
): PoiVisit[] {
  if (!selectedPois || selectedPois.length === 0) return []

  const stores = [pubs, spires, towers, phones, schools]
  const pathKeys = new Set<string>([destinationGridKey, ...(movementPath ?? [])])
  const pathCentres: Array<[number, number]> = []
  for (const key of pathKeys) {
    pathCentres.push(gridKeyToLatLng(key))
  }

  const visits: PoiVisit[] = []
  const visitedIds = new Set<string>()

  for (const selected of selectedPois) {
    const poiId = `${selected.category}:${selected.osmId}`
    if (visitedIds.has(poiId)) continue

    let lat = selected.lat
    let lng = selected.lng
    let name = selected.name ?? null
    if (lat == null || lng == null) {
      const storeIdx = STORE_BY_CATEGORY[selected.category]
      const match = storeIdx == null ? null : stores[storeIdx].find((item) => item.id === selected.osmId)
      if (!match) continue
      lat = match.lat
      lng = match.lng
      name = match.name
    }

    const poiGrid = latLngToGridKey(lat, lng)
    const onPath = pathKeys.has(poiGrid) || pathCentres.some(([pLat, pLng]) => (
      haversineMetres(pLat, pLng, lat, lng) <= COLLECTION_RADIUS_METRES
    ))
    if (!onPath) continue

    visits.push({ id: poiId, category: selected.category, name })
    visitedIds.add(poiId)
  }

  return visits
}
