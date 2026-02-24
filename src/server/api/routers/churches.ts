import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { log } from "@/lib/utils";
import { queryOverpass, type OverpassResponse, type OverpassElement } from "@/server/overpass";
import { classifyChurch } from "@/lib/poi-categories";
import { isNearMotorway, motorwayOverpassClause } from "@/server/motorway-filter";

const boundsInput = z.object({
  south: z.number(),
  west: z.number(),
  north: z.number(),
  east: z.number(),
});

let cachedResult: { bbox: string; data: OverpassResponse; motorways: OverpassElement[]; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

async function fetchAllChurches(bbox: string): Promise<{ data: OverpassResponse; motorways: OverpassElement[] }> {
  if (cachedResult && cachedResult.bbox === bbox && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    return { data: cachedResult.data, motorways: cachedResult.motorways };
  }

  const query = [
    "[out:json][timeout:25];",
    "(",
    `node["amenity"="place_of_worship"]["religion"="christian"](${bbox});`,
    `way["amenity"="place_of_worship"]["religion"="christian"](${bbox});`,
    motorwayOverpassClause(bbox),
    ");",
    "out center body geom;",
  ].join("");

  const raw = await queryOverpass(query);

  const churches: OverpassElement[] = [];
  const motorways: OverpassElement[] = [];

  for (const el of raw.elements) {
    const hw = el.tags?.highway;
    if (el.type === "way" && (hw === "motorway" || hw === "motorway_link")) {
      motorways.push(el);
    } else {
      churches.push(el);
    }
  }

  const data: OverpassResponse = { elements: churches };
  cachedResult = { bbox, data, motorways, timestamp: Date.now() };
  return { data, motorways };
}

function parseChurches(data: OverpassResponse, motorways: OverpassElement[]) {
  return data.elements
    .map((el) => ({
      id: el.id,
      lat: el.lat ?? el.center?.lat,
      lng: el.lon ?? el.center?.lon,
      name: el.tags?.name ?? null,
      churchType: classifyChurch(el.tags ?? {}, el.id),
    }))
    .filter((el): el is { id: number; lat: number; lng: number; name: string | null; churchType: "spire" | "tower" } =>
      el.lat != null && el.lng != null && !isNearMotorway(el.lat!, el.lng!, motorways)
    );
}

export const churchesRouter = createTRPCRouter({
  spiresInBounds: publicProcedure
    .input(boundsInput)
    .query(async ({ input }) => {
      const bbox = `${input.south},${input.west},${input.north},${input.east}`;
      const { data, motorways } = await fetchAllChurches(bbox);
      const all = parseChurches(data, motorways);
      const spires = all.filter((c) => c.churchType === "spire");
      log.debug("Churches with spires:", spires.length, "of", all.length, "total churches");
      return spires;
    }),

  towersInBounds: publicProcedure
    .input(boundsInput)
    .query(async ({ input }) => {
      const bbox = `${input.south},${input.west},${input.north},${input.east}`;
      const { data, motorways } = await fetchAllChurches(bbox);
      const all = parseChurches(data, motorways);
      const towers = all.filter((c) => c.churchType === "tower");
      log.debug("Churches with towers:", towers.length, "of", all.length, "total churches");
      return towers;
    }),
});
