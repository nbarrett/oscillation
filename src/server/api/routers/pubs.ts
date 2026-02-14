import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { log } from "@/lib/utils";
import { queryOverpass, type OverpassElement } from "@/server/overpass";

function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distanceMetres(px, py, ax, ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return distanceMetres(px, py, ax + t * dx, ay + t * dy);
}

const ROAD_PROXIMITY_METRES = 75;

export const pubsRouter = createTRPCRouter({
  inBounds: publicProcedure
    .input(
      z.object({
        south: z.number(),
        west: z.number(),
        north: z.number(),
        east: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { south, west, north, east } = input;
      const bbox = `${south},${west},${north},${east}`;
      const query = [
        "[out:json][timeout:25];",
        "(",
        `node["amenity"="pub"](${bbox});`,
        `way["highway"~"^(trunk|primary|secondary)$"](${bbox});`,
        ");",
        "out body geom;",
      ].join("");

      const data = await queryOverpass(query);

      const pubs: (OverpassElement & { lat: number; lon: number })[] = [];
      const roads: OverpassElement[] = [];

      for (const el of data.elements) {
        if (el.type === "node" && el.lat != null && el.lon != null) {
          pubs.push(el as OverpassElement & { lat: number; lon: number });
        } else if (el.type === "way" && el.geometry) {
          roads.push(el);
        }
      }

      const nearRoad = pubs.filter((pub) => {
        for (const road of roads) {
          if (!road.geometry) continue;
          for (let i = 0; i < road.geometry.length - 1; i++) {
            const a = road.geometry[i]!;
            const b = road.geometry[i + 1]!;
            if (distanceToSegment(pub.lat, pub.lon, a.lat, a.lon, b.lat, b.lon) <= ROAD_PROXIMITY_METRES) {
              return true;
            }
          }
        }
        return false;
      });

      log.debug("Pubs near A/B roads:", nearRoad.length, "of", pubs.length, "total pubs");

      return nearRoad.map((el) => ({
        id: el.id,
        lat: el.lat,
        lng: el.lon,
        name: el.tags?.name ?? null,
      }));
    }),
});
