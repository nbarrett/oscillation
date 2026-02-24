import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { log } from "@/lib/utils";
import { queryOverpass, type OverpassElement } from "@/server/overpass";
import { distanceToSegment, isNearMotorway, motorwayOverpassClause } from "@/server/motorway-filter";

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
        motorwayOverpassClause(bbox),
        ");",
        "out body geom;",
      ].join("");

      const data = await queryOverpass(query);

      const pubs: (OverpassElement & { lat: number; lon: number })[] = [];
      const roads: OverpassElement[] = [];
      const motorways: OverpassElement[] = [];

      for (const el of data.elements) {
        if (el.type === "node" && el.lat != null && el.lon != null) {
          pubs.push(el as OverpassElement & { lat: number; lon: number });
        } else if (el.type === "way" && el.geometry) {
          const hw = el.tags?.highway;
          if (hw === "motorway" || hw === "motorway_link") {
            motorways.push(el);
          } else {
            roads.push(el);
          }
        }
      }

      const nearRoad = pubs.filter((pub) => {
        if (isNearMotorway(pub.lat, pub.lon, motorways)) return false;
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
