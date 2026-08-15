import { describe, expect, it } from "vitest"
import { classifyRoadType } from "@/lib/road-data"

describe("classifyRoadType", () => {
  it("treats OSM ref B-roads as B even when the highway class is higher", () => {
    expect(classifyRoadType("primary", "B198")).toBe("B")
    expect(classifyRoadType("tertiary", "B1383")).toBe("B")
    expect(classifyRoadType("secondary", "B1040")).toBe("B")
  })

  it("treats OSM ref A-roads as A even when the highway class is lower", () => {
    expect(classifyRoadType("secondary", "A10")).toBe("A")
    expect(classifyRoadType("trunk", "A1")).toBe("A")
    expect(classifyRoadType("primary", "A1(M)")).toBe("A")
  })

  it("classifies motorways from ref or highway", () => {
    expect(classifyRoadType("motorway", "M25")).toBe("M")
    expect(classifyRoadType("motorway_link", null)).toBe("M")
  })

  it("falls back to highway class when there is no numbered ref", () => {
    expect(classifyRoadType("primary", null)).toBe("A")
    expect(classifyRoadType("trunk_link", "")).toBe("A")
    expect(classifyRoadType("secondary", null)).toBe("B")
    expect(classifyRoadType("tertiary", null)).toBe("B")
    expect(classifyRoadType("unclassified", null)).toBe("B")
    expect(classifyRoadType("residential", null)).toBe(null)
    expect(classifyRoadType("service", "B")).toBe(null)
  })
})
