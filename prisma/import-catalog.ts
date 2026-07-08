/**
 * Builds the plant catalog from open databases:
 * - PlantSolve API (detailed houseplants) — CC BY-NC 4.0
 * - bripatch/plant-variety-database — CC BY 4.0
 * - WCVP / Kew (World Checklist of Vascular Plants) — CC BY 4.0
 *   Successor to The Plant List + IPNI taxonomy
 * - netplant.ir + imp.ac.ir Persian/medicinal reference names
 *
 * Run: npm run catalog:import
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import {
  getPersianName,
  getCategoryFa,
  mapWaterRequirement,
} from "../src/data/plantNames";
import type { CatalogEntry } from "./lib/catalog-entry";
import { dedupeCatalog, parseCsvLine, slugify } from "./lib/catalog-entry";
import { importWcvp } from "./import-wcvp";
import { importPersianSources } from "./import-persian-sources";

const PLANTSOLVE_INDEX =
  "https://www.plantsolve.com/api/v1/plants/index.json";
const PLANTSOLVE_PLANT = (slug: string) =>
  `https://www.plantsolve.com/api/v1/plants/${slug}.json`;
const BRIPATCH_CSV =
  "https://raw.githubusercontent.com/bripatch/plant-variety-database/main/data/varieties.csv";

async function fetchPlantSolve(): Promise<CatalogEntry[]> {
  console.log("Fetching PlantSolve index...");
  const res = await fetch(PLANTSOLVE_INDEX);
  const index = (await res.json()) as Array<{
    id: string;
    name: string;
    slug: string;
    scientificName?: string;
    difficulty?: string;
  }>;

  const entries: CatalogEntry[] = [];
  let done = 0;

  for (const item of index) {
    try {
      const detailRes = await fetch(PLANTSOLVE_PLANT(item.slug));
      if (!detailRes.ok) {
        console.warn(`  skip ${item.slug} (${detailRes.status})`);
        continue;
      }
      const p = await detailRes.json();
      const care = p.care || {};
      const lighting = p.lighting || {};
      const nutrients = p.nutrients || {};
      const growth = p.growthCharacteristics || {};
      const taxonomy = p.taxonomy || {};

      entries.push({
        externalId: p.id || item.id,
        slug: `ps-${item.slug}`,
        nameEn: p.name || item.name,
        nameFa: getPersianName(p.name || item.name, "houseplant"),
        scientificName:
          taxonomy.sciName || item.scientificName || p.scientificName || null,
        category: "houseplant",
        categoryFa: getCategoryFa("houseplant"),
        description: p.contentText?.slice(0, 500) || p.metaDescription || null,
        sunRequirement: lighting.intensity || lighting.description?.slice(0, 80) || null,
        waterRequirement: mapWaterRequirement(care.watering) || "medium",
        soilType: care.soil || null,
        soilPh: p.parameters?.soilPH?.recommended || null,
        difficulty: care.difficulty || item.difficulty || null,
        wateringGuide: care.watering || null,
        lightGuide: lighting.description || care.placement || null,
        fertilizerGuide: nutrients.fertilizerFrequency || null,
        soilGuide: care.soil || null,
        toxicity: care.toxicity || null,
        isIndoor: growth.indoorCapable === "yes" || true,
        isContainerFriendly: growth.containerFriendly === "yes" || true,
        usdaZoneMin: null,
        usdaZoneMax: null,
        imageUrl: p.featuredImage
          ? `https://www.plantsolve.com${p.featuredImage}`
          : null,
        source: "plantsolve",
        rawData: JSON.stringify(p),
      });
      done++;
      if (done % 20 === 0) console.log(`  PlantSolve: ${done}/${index.length}`);
      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
      console.warn(`  error ${item.slug}:`, e);
    }
  }

  console.log(`PlantSolve imported: ${entries.length} plants`);
  return entries;
}

async function fetchBripatch(): Promise<CatalogEntry[]> {
  console.log("Fetching bripatch varieties.csv...");
  const res = await fetch(BRIPATCH_CSV);
  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.trim());
  const headers = parseCsvLine(lines[0]);
  const col = (name: string) => headers.indexOf(name);

  const entries: CatalogEntry[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < headers.length) continue;

    const name = cols[col("name")]?.trim();
    const category = cols[col("category")]?.trim() || "general";
    const scientificName = cols[col("scientific_name")]?.trim() || null;
    const slug = cols[col("slug")]?.trim() || slugify(name, category);
    const externalId = `bv-${cols[col("id")] || i}`;

    if (!name || seen.has(externalId)) continue;
    seen.add(externalId);

    const zoneMin = parseInt(cols[col("usda_zone_min")] || "", 10);
    const zoneMax = parseInt(cols[col("usda_zone_max")] || "", 10);

    entries.push({
      externalId,
      slug: `bv-${category}-${slug}`,
      nameEn: name,
      nameFa: getPersianName(name, category),
      scientificName,
      category,
      categoryFa: getCategoryFa(category),
      description: cols[col("description")]?.slice(0, 500) || null,
      sunRequirement: cols[col("sun_requirement")] || null,
      waterRequirement: mapWaterRequirement(cols[col("water_requirement")]),
      soilType: cols[col("soil_type")] || null,
      soilPh: cols[col("soil_ph")] || null,
      difficulty: cols[col("growing_difficulty")] || null,
      wateringGuide: cols[col("water_requirement")] || null,
      lightGuide: cols[col("sun_requirement")] || null,
      fertilizerGuide: null,
      soilGuide: cols[col("soil_type")] || null,
      toxicity: null,
      isIndoor:
        category === "houseplant" ||
        category === "succulent" ||
        cols[col("is_container_friendly")]?.toLowerCase() === "true",
      isContainerFriendly:
        cols[col("is_container_friendly")]?.toLowerCase() === "true",
      usdaZoneMin: Number.isNaN(zoneMin) ? null : zoneMin,
      usdaZoneMax: Number.isNaN(zoneMax) ? null : zoneMax,
      imageUrl: cols[col("url")] || null,
      source: "bripatch",
      rawData: null,
    });
  }

  console.log(`Bripatch imported: ${entries.length} varieties`);
  return entries;
}

async function main() {
  const dataDir = join(process.cwd(), "prisma", "data");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  console.log("=== گیاه‌یار catalog import ===\n");

  const [plantSolve, bripatch, wcvp, persian] = await Promise.all([
    fetchPlantSolve(),
    fetchBripatch(),
    importWcvp(dataDir),
    Promise.resolve(importPersianSources(dataDir)),
  ]);

  const merged = dedupeCatalog([
    ...plantSolve,
    ...bripatch,
    ...persian,
    ...wcvp,
  ]);

  const outPath = join(dataDir, "plant-catalog.json");
  writeFileSync(outPath, JSON.stringify(merged, null, 0));

  console.log(`\nSaved ${merged.length} unique plants to ${outPath}`);
  console.log(`  PlantSolve:  ${plantSolve.length}`);
  console.log(`  Bripatch:    ${bripatch.length}`);
  console.log(`  WCVP (Kew):  ${wcvp.length}`);
  console.log(`  Persian/IMP: ${persian.length}`);
  console.log(`  Sources: The Plant List → WCVP, IPNI, netplant.ir, imp.ac.ir`);
}

main().catch(console.error);
