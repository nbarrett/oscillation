import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { log } from "@/lib/utils";
import { queryOverpass, type OverpassElement } from "@/server/overpass";
import { isNearMotorway, motorwayOverpassClause } from "@/server/motorway-filter";

export const schoolsRouter = createTRPCRouter({
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
        `node["amenity"="school"](${bbox});`,
        `way["amenity"="school"](${bbox});`,
        `node["amenity"="college"](${bbox});`,
        `way["amenity"="college"](${bbox});`,
        motorwayOverpassClause(bbox),
        ");",
        "out center body geom;",
      ].join("");

      const data = await queryOverpass(query);

      const motorways: OverpassElement[] = [];
      const schoolElements: OverpassElement[] = [];

      for (const el of data.elements) {
        const hw = el.tags?.highway;
        if (el.type === "way" && (hw === "motorway" || hw === "motorway_link")) {
          motorways.push(el);
        } else {
          schoolElements.push(el);
        }
      }

      const schools = schoolElements
        .map((el) => ({
          id: el.id,
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          name: el.tags?.name ?? null,
        }))
        .filter((el): el is { id: number; lat: number; lng: number; name: string | null } =>
          el.lat != null && el.lng != null && !isNearMotorway(el.lat!, el.lng!, motorways)
        );

      log.debug("Schools/colleges:", schools.length);

      return schools;
    }),
});
