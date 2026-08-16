import { describe, expect, it } from "vitest"
import { detectPoiVisits } from "@/lib/poi-detection"
import { latLngToGridKey } from "@/lib/road-data"

describe("detectPoiVisits", () => {
  it("collects a staging post from selectedPois even when overlay stores are empty", () => {
    const [lat, lng] = [52.0, 0.1]
    const destKey = latLngToGridKey(lat, lng)
    const visits = detectPoiVisits(
      destKey,
      [],
      [],
      [],
      [],
      [],
      [{ category: "pub", osmId: 99, name: "The Red Lion", lat, lng }],
      [destKey],
    )
    expect(visits).toEqual([
      { id: "pub:99", category: "pub", name: "The Red Lion" },
    ])
  })

  it("does not collect a staging post the path never approached", () => {
    const startKey = "500000-200000"
    const visits = detectPoiVisits(
      startKey,
      [],
      [],
      [],
      [],
      [],
      [{ category: "pub", osmId: 1, name: "Far Away", lat: 57.0, lng: -4.0 }],
      [startKey],
    )
    expect(visits).toEqual([])
  })
})
