import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { log } from "@/lib/utils";
import { queryOverpass } from "@/server/overpass";

export const phonesRouter = createTRPCRouter({
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
        `node["amenity"="telephone"](${bbox});`,
        `node["emergency"="phone"](${bbox});`,
        ");",
        "out center body;",
      ].join("");

      const data = await queryOverpass(query);

      const phones = data.elements
        .map((el) => ({
          id: el.id,
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          name: el.tags?.name ?? el.tags?.description ?? "Telephone",
        }))
        .filter((el): el is { id: number; lat: number; lng: number; name: string | null } =>
          el.lat != null && el.lng != null
        );

      log.debug("Phone boxes:", phones.length);

      return phones;
    }),
});
