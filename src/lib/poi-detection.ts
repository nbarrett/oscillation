import { latLngToGridKey } from "@/lib/road-data"
import type { PoiItem } from "@/stores/poi-types"

export interface PoiVisit {
  id: string;
  category: string;
  name: string | null;
}

export function detectPoiVisits(
  destinationGridKey: string,
  pubs: PoiItem[],
  spires: PoiItem[],
  towers: PoiItem[],
  phones: PoiItem[],
  schools: PoiItem[],
  selectedPois: Array<{ category: string; osmId: number }> | null,
): PoiVisit[] {
  if (!selectedPois || selectedPois.length === 0) return []

  const selectedSet = new Set(selectedPois.map(p => `${p.category}:${p.osmId}`))
  const visits: PoiVisit[] = []

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
      const poiGridKey = latLngToGridKey(poi.lat, poi.lng)
      if (poiGridKey === destinationGridKey) {
        visits.push({ id: poiId, category, name: poi.name })
      }
    }
  }

  return visits
}
