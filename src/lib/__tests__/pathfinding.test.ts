import { describe, expect, it } from "vitest"
import { pathsAtExactSteps, reachableRoadGrids, shortestPath } from "@/lib/road-data"

describe("pathfinding", () => {
  it("finds the orthogonal 1-step neighbours without road data", () => {
    const start = "500000-200000"
    const reachable = reachableRoadGrids(start, 1)
    expect(reachable.size).toBe(4)
    expect(reachable.get("500000-201000")).toBe(1)
    expect(reachable.get("500000-199000")).toBe(1)
    expect(reachable.get("501000-200000")).toBe(1)
    expect(reachable.get("499000-200000")).toBe(1)
  })

  it("builds exact-step paths in a single walk", () => {
    const start = "500000-200000"
    const paths = pathsAtExactSteps(start, 2)
    expect(paths.length).toBeGreaterThan(0)
    expect(paths.every((path) => path.length === 2)).toBe(true)
    const northTwo = paths.find((path) => path[1] === "500000-202000")
    expect(northTwo).toEqual(["500000-201000", "500000-202000"])
  })

  it("shortestPath matches a reconstructed exact path", () => {
    const start = "500000-200000"
    const target = "502000-200000"
    const found = shortestPath(start, target, 3)
    expect(found).toEqual(["501000-200000", "502000-200000"])
  })
})
