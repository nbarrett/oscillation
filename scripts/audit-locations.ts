import { PrismaClient } from "@prisma/client";
import { areaSizeBounds } from "../src/lib/area-size";
import { validatePoiCoverage } from "../src/server/overpass";
import { POI_CATEGORY_LABELS, type PoiCategory } from "../src/lib/poi-categories";

const prisma = new PrismaClient();

const AREA_SIZE = "standard" as const;
const MAX_VALIDATION_ATTEMPTS = 4;
const RETRY_DELAY_MS = 5000;
const DELETE = process.argv.includes("--delete");

interface AuditResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  valid: boolean;
  reason: string;
  counts?: Record<PoiCategory, number>;
  hasMotorway?: boolean;
  hasRailway?: boolean;
}

async function validateWithRetries(name: string, lat: number, lng: number): Promise<AuditResult["valid"] extends boolean ? Omit<AuditResult, "id" | "name" | "lat" | "lng"> : never> {
  const bounds = areaSizeBounds(lat, lng, AREA_SIZE);
  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= MAX_VALIDATION_ATTEMPTS; attempt++) {
    try {
      const result = await validatePoiCoverage(bounds.south, bounds.west, bounds.north, bounds.east, lat, lng);
      const missing = result.missing.map((c) => POI_CATEGORY_LABELS[c]);
      const insufficient = result.insufficient.map((c) => `${POI_CATEGORY_LABELS[c]}=${result.counts[c]}`);
      const reasons: string[] = [];
      if (missing.length) reasons.push(`missing ${missing.join(", ")}`);
      if (insufficient.length) reasons.push(`low ${insufficient.join(", ")}`);
      if (!result.hasMotorway) reasons.push("no motorway");
      if (!result.hasRailway) reasons.push("no railway");
      if (!result.onABRoad) reasons.push("not on A/B road");
      return {
        valid: result.valid,
        reason: result.valid ? "ok" : reasons.join("; "),
        counts: result.counts,
        hasMotorway: result.hasMotorway,
        hasRailway: result.hasRailway,
      };
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      console.warn(`  [${name}] attempt ${attempt} failed: ${lastErr.message}`);
      if (attempt < MAX_VALIDATION_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }
  return { valid: false, reason: `overpass error: ${lastErr?.message ?? "unknown"}` };
}

async function main() {
  const locations = await prisma.namedLocation.findMany({ orderBy: { name: "asc" } });
  console.log(`Auditing ${locations.length} locations against Standard (34x28 km) area size`);
  console.log(`Mode: ${DELETE ? "DELETE invalid locations" : "DRY RUN (use --delete to remove)"}`);
  console.log("");

  const results: AuditResult[] = [];
  let processed = 0;
  for (const loc of locations) {
    processed++;
    const padded = `[${processed}/${locations.length}]`;
    process.stdout.write(`${padded} ${loc.name.padEnd(30)} ... `);
    const r = await validateWithRetries(loc.name, loc.lat, loc.lng);
    results.push({ id: loc.id, name: loc.name, lat: loc.lat, lng: loc.lng, ...r });
    console.log(r.valid ? "VALID" : `INVALID — ${r.reason}`);
  }

  const valid = results.filter((r) => r.valid);
  const invalid = results.filter((r) => !r.valid);

  console.log("");
  console.log(`========== SUMMARY ==========`);
  console.log(`Valid:   ${valid.length}`);
  console.log(`Invalid: ${invalid.length}`);
  console.log("");

  if (invalid.length) {
    console.log("Invalid locations:");
    for (const r of invalid) {
      console.log(`  - ${r.name} (${r.lat}, ${r.lng}) — ${r.reason}`);
    }
    console.log("");

    if (DELETE) {
      console.log("Deleting invalid locations from database...");
      let deleted = 0;
      for (const r of invalid) {
        try {
          await prisma.namedLocation.delete({ where: { id: r.id } });
          deleted++;
        } catch (err) {
          console.warn(`  Failed to delete ${r.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      console.log(`Deleted ${deleted}/${invalid.length} locations`);
    } else {
      console.log("Re-run with --delete to remove these from the database.");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
