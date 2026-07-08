/**
 * Parses WCVP (World Checklist of Vascular Plants) from Kew.
 * Download: https://sftp.kew.org/pub/data-repositories/WCVP/wcvp.zip
 * License: CC-BY 4.0 — successor to The Plant List / IPNI taxonomy.
 */
import { createReadStream, existsSync } from "fs";
import { createInterface } from "readline";
import { join } from "path";
import {
  getPersianName,
  getCategoryFa,
} from "../src/data/plantNames";
import type { CatalogEntry } from "./lib/catalog-entry";
import { slugify } from "./lib/catalog-entry";

const WCVP_COLUMNS = [
  "plant_name_id",
  "ipni_id",
  "taxon_rank",
  "taxon_status",
  "family",
  "genus_hybrid",
  "genus",
  "species_hybrid",
  "species",
  "infraspecific_rank",
  "infraspecies",
  "parenthetical_author",
  "primary_author",
  "publication_author",
  "place_of_publication",
  "volume_and_page",
  "first_published",
  "nomenclatural_remarks",
  "geographic_area",
  "lifeform_description",
  "climate_description",
  "taxon_name",
  "taxon_authors",
  "accepted_plant_name_id",
  "basionym_plant_name_id",
  "replaced_synonym_author",
  "homotypic_synonym",
  "parent_plant_name_id",
  "powo_id",
  "hybrid_formula",
  "reviewed",
] as const;

const HORTICULTURAL_FAMILIES = new Set([
  "Araceae",
  "Asparagaceae",
  "Arecaceae",
  "Cactaceae",
  "Crassulaceae",
  "Euphorbiaceae",
  "Moraceae",
  "Lamiaceae",
  "Solanaceae",
  "Brassicaceae",
  "Fabaceae",
  "Rosaceae",
  "Asteraceae",
  "Orchidaceae",
  "Bromeliaceae",
  "Marantaceae",
  "Commelinaceae",
  "Apocynaceae",
  "Rubiaceae",
  "Zingiberaceae",
  "Amaryllidaceae",
  "Liliaceae",
  "Begoniaceae",
  "Gesneriaceae",
  "Malvaceae",
  "Cucurbitaceae",
  "Apiaceae",
  "Poaceae",
  "Pinaceae",
  "Cupressaceae",
  "Fagaceae",
  "Betulaceae",
  "Salicaceae",
  "Oleaceae",
  "Caprifoliaceae",
  "Hydrangeaceae",
  "Ericaceae",
  "Vitaceae",
  "Passifloraceae",
  "Anacardiaceae",
  "Rutaceae",
  "Piperaceae",
  "Polypodiaceae",
  "Pteridaceae",
  "Dryopteridaceae",
]);

const MEDICINAL_FAMILIES = new Set([
  "Lamiaceae",
  "Apiaceae",
  "Asteraceae",
  "Fabaceae",
  "Rubiaceae",
  "Zingiberaceae",
  "Amaryllidaceae",
  "Liliaceae",
  "Papaveraceae",
  "Ranunculaceae",
  "Scrophulariaceae",
  "Plantaginaceae",
  "Verbenaceae",
  "Boraginaceae",
  "Caryophyllaceae",
  "Hypericaceae",
  "Cannabaceae",
  "Malvaceae",
  "Solanaceae",
  "Brassicaceae",
]);

function inferCategory(family: string, lifeform?: string): string {
  const lf = (lifeform || "").toLowerCase();
  if (HORTICULTURAL_FAMILIES.has(family)) {
    if (lf.includes("tree")) return "ornamental-tree";
    if (lf.includes("shrub")) return "shrub";
    if (lf.includes("herb")) return "herb";
    if (family === "Cactaceae" || family === "Crassulaceae") return "succulent";
    if (
      family === "Araceae" ||
      family === "Asparagaceae" ||
      family === "Marantaceae"
    ) {
      return "houseplant";
    }
    return "flower";
  }
  if (MEDICINAL_FAMILIES.has(family)) return "herb";
  if (lf.includes("tree")) return "ornamental-tree";
  if (lf.includes("shrub")) return "shrub";
  return "native-wildflower";
}

function isUsefulFamily(family: string): boolean {
  return HORTICULTURAL_FAMILIES.has(family) || MEDICINAL_FAMILIES.has(family);
}

function resolveWcvpPath(dataDir: string): string | null {
  const candidates = [
    join(dataDir, "wcvp", "wcvp_names.csv"),
    join(dataDir, "wcvp", "wcvp_names.txt"),
  ];
  return candidates.find((path) => existsSync(path)) ?? null;
}

export async function importWcvp(
  dataDir: string,
  options?: { maxEntries?: number }
): Promise<CatalogEntry[]> {
  const namesPath = resolveWcvpPath(dataDir);
  if (!namesPath) {
    console.log(
      "  WCVP file missing. Download wcvp.zip from https://sftp.kew.org/pub/data-repositories/WCVP/ and extract to prisma/data/wcvp/"
    );
    return [];
  }

  const maxEntries = options?.maxEntries ?? 25000;
  const entries: CatalogEntry[] = [];
  const stream = createReadStream(namesPath, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let lineNo = 0;
  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;
    if (lineNo === 1 && line.startsWith("plant_name_id|")) continue;

    const cols = line.split("|");
    if (cols.length < WCVP_COLUMNS.length) continue;

    const row = Object.fromEntries(
      WCVP_COLUMNS.map((key, index) => [key, cols[index] ?? ""])
    ) as Record<(typeof WCVP_COLUMNS)[number], string>;

    if (row.taxon_status !== "Accepted") continue;
    if (row.taxon_rank !== "Species") continue;
    if (!row.genus?.trim() || !row.species?.trim()) continue;
    if (!isUsefulFamily(row.family)) continue;

    const scientificName = `${row.genus.trim()} ${row.species.trim()}`;
    const category = inferCategory(row.family, row.lifeform_description);
    const nameEn = scientificName;
    const inIran =
      row.geographic_area.includes("Iran") ||
      row.geographic_area.includes("Persia");

    entries.push({
      externalId: `wcvp-${row.plant_name_id}`,
      slug: slugify(scientificName, "wcvp"),
      nameEn,
      nameFa: getPersianName(nameEn, category),
      scientificName,
      category,
      categoryFa: getCategoryFa(category),
      description: row.geographic_area
        ? `پراکنش: ${row.geographic_area.slice(0, 400)}`
        : null,
      sunRequirement: null,
      waterRequirement: "medium",
      soilType: null,
      soilPh: null,
      difficulty: null,
      wateringGuide: null,
      lightGuide: row.lifeform_description || null,
      fertilizerGuide: null,
      soilGuide: null,
      toxicity: null,
      isIndoor:
        category === "houseplant" ||
        category === "succulent" ||
        HORTICULTURAL_FAMILIES.has(row.family),
      isContainerFriendly:
        category === "houseplant" || category === "succulent",
      usdaZoneMin: null,
      usdaZoneMax: null,
      imageUrl: null,
      source: "wcvp",
      rawData: JSON.stringify({
        plant_name_id: row.plant_name_id,
        ipni_id: row.ipni_id,
        family: row.family,
        taxon_name: row.taxon_name,
        taxon_authors: row.taxon_authors,
        geographic_area: row.geographic_area,
        lifeform: row.lifeform_description,
        climate: row.climate_description,
        powo_id: row.powo_id,
        inIran,
        references: {
          wcvp: "https://wcvp.science.kew.org/",
          ipni: "https://www.ipni.org/",
          plantList: "http://www.theplantlist.org/",
          kewSftp: "https://sftp.kew.org/pub/data-repositories/WCVP/",
        },
      }),
    });

    if (entries.length >= maxEntries) break;
    if (entries.length % 5000 === 0) {
      console.log(`  WCVP parsed: ${entries.length} species...`);
    }
  }

  console.log(`WCVP imported: ${entries.length} accepted species (from ${lineNo} rows)`);
  return entries;
}
