import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { log } from "@/lib/utils";
import { queryOverpass, type OverpassResponse } from "@/server/overpass";
import { classifyChurch } from "@/lib/poi-categories";

const boundsInput = z.object({
  south: z.number(),
  west: z.number(),
  north: z.number(),
  east: z.number(),
});

let cachedResult: { bbox: string; data: OverpassResponse; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

async function fetchAllChurches(bbox: string): Promise<OverpassResponse> {
  if (cachedResult && cachedResult.bbox === bbox && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    return cachedResult.data;
  }

  const query = [
    "[out:json][timeout:25];",
    "(",
    `node["amenity"="place_of_worship"]["religion"="christian"](${bbox});`,
    `way["amenity"="place_of_worship"]["religion"="christian"](${bbox});`,
    ");",
    "out center body;",
  ].join("");

  const data = await queryOverpass(query);
  cachedResult = { bbox, data, timestamp: Date.now() };
  return data;
}

function parseChurches(data: OverpassResponse) {
  return data.elements
    .map((el) => ({
      id: el.id,
      lat: el.lat ?? el.center?.lat,
      lng: el.lon ?? el.center?.lon,
      name: el.tags?.name ?? null,
      churchType: classifyChurch(el.tags ?? {}, el.id),
    }))
    .filter((el): el is { id: number; lat: number; lng: number; name: string | null; churchType: "spire" | "tower" } =>
      el.lat != null && el.lng != null
    );
}

export const churchesRouter = createTRPCRouter({
  spiresInBounds: publicProcedure
    .input(boundsInput)
    .query(async ({ input }) => {
      const bbox = `${input.south},${input.west},${input.north},${input.east}`;
      const data = await fetchAllChurches(bbox);
      const all = parseChurches(data);
      const spires = all.filter((c) => c.churchType === "spire");
      log.debug("Churches with spires:", spires.length, "of", all.length, "total churches");
      return spires;
    }),

  towersInBounds: publicProcedure
    .input(boundsInput)
    .query(async ({ input }) => {
      const bbox = `${input.south},${input.west},${input.north},${input.east}`;
      const data = await fetchAllChurches(bbox);
      const all = parseChurches(data);
      const towers = all.filter((c) => c.churchType === "tower");
      log.debug("Churches with towers:", towers.length, "of", all.length, "total churches");
      return towers;
    }),
});
