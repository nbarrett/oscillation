export type PoiCategory = "pub" | "spire" | "tower" | "phone" | "school";

export const POI_CATEGORIES: PoiCategory[] = ["pub", "spire", "tower", "phone", "school"];

export const MIN_POIS_PER_CATEGORY = 5;

export const POI_CATEGORY_LABELS: Record<PoiCategory, string> = {
  pub: "Pubs",
  spire: "Spires",
  tower: "Towers",
  phone: "Phones",
  school: "Schools",
};

export interface PoiValidationResult {
  valid: boolean;
  counts: Record<PoiCategory, number>;
  missing: PoiCategory[];
  insufficient: PoiCategory[];
  hasMotorway: boolean;
  hasRailway: boolean;
}

const SPIRE_TOWER_TYPES = new Set(["spire", "steeple"]);
const SPIRE_NAME_PATTERNS = /\bcathedral\b|\bminster\b/i;

export function classifyChurch(tags: Record<string, string>, elementId: number = 0): "spire" | "tower" {
  const towerType = tags["tower:type"];
  if (towerType && SPIRE_TOWER_TYPES.has(towerType)) return "spire";
  if (tags["building"] === "cathedral") return "spire";
  const name = tags["name"] ?? "";
  if (SPIRE_NAME_PATTERNS.test(name)) return "spire";
  return elementId % 2 === 0 ? "spire" : "tower";
}
