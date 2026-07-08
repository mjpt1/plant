/**
 * Persian plant names from netplant.ir and imp.ac.ir reference lists.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  getCategoryFa,
  getPersianName,
} from "../src/data/plantNames";
import type { CatalogEntry } from "./lib/catalog-entry";
import { slugify } from "./lib/catalog-entry";

interface PersianNameRow {
  scientificName: string;
  nameFa: string;
  nameEn?: string;
  family?: string;
  category?: string;
  source: "netplant" | "imp";
  uses?: string[];
  light?: string;
  water?: string;
  soil?: string;
}

const NETPLANT_SEED: PersianNameRow[] = [
  { scientificName: "Salvia officinalis", nameFa: "مریم‌گلی", nameEn: "Sage", category: "herb", source: "netplant", uses: ["medicinal", "culinary"] },
  { scientificName: "Mentha piperita", nameFa: "نعناع فلفلی", nameEn: "Peppermint", category: "herb", source: "netplant", uses: ["medicinal", "culinary"] },
  { scientificName: "Rosmarinus officinalis", nameFa: "رزماری", nameEn: "Rosemary", category: "herb", source: "netplant", uses: ["medicinal", "culinary"] },
  { scientificName: "Thymus vulgaris", nameFa: "آویشن", nameEn: "Thyme", category: "herb", source: "netplant", uses: ["medicinal", "culinary"] },
  { scientificName: "Ocimum basilicum", nameFa: "ریحان", nameEn: "Basil", category: "herb", source: "netplant", uses: ["culinary"] },
  { scientificName: "Matricaria chamomilla", nameFa: "بابونه", nameEn: "Chamomile", category: "herb", source: "netplant", uses: ["medicinal"] },
  { scientificName: "Calendula officinalis", nameFa: "آفتاب‌پرست", nameEn: "Calendula", category: "flower", source: "netplant", uses: ["medicinal"] },
  { scientificName: "Lavandula angustifolia", nameFa: "اسطوخودوس", nameEn: "Lavender", category: "herb", source: "netplant", uses: ["medicinal", "ornamental"] },
  { scientificName: "Aloe vera", nameFa: "آلوئه ورا", nameEn: "Aloe Vera", category: "succulent", source: "netplant", uses: ["medicinal"] },
  { scientificName: "Nigella sativa", nameFa: "سیاه‌دانه", nameEn: "Black Seed", category: "herb", source: "imp", uses: ["medicinal"] },
  { scientificName: "Crocus sativus", nameFa: "زعفران", nameEn: "Saffron", category: "herb", source: "imp", uses: ["medicinal", "culinary"] },
  { scientificName: "Punica granatum", nameFa: "انار", nameEn: "Pomegranate", category: "fruit-tree", source: "netplant", uses: ["medicinal", "culinary"] },
  { scientificName: "Ficus carica", nameFa: "انجیر", nameEn: "Fig", category: "fruit-tree", source: "netplant", uses: ["culinary"] },
  { scientificName: "Olea europaea", nameFa: "زیتون", nameEn: "Olive", category: "fruit-tree", source: "netplant", uses: ["culinary"] },
  { scientificName: "Rosa damascena", nameFa: "گل محمدی", nameEn: "Damask Rose", category: "rose", source: "imp", uses: ["medicinal", "ornamental"] },
  { scientificName: "Jasminum officinale", nameFa: "یاسمن", nameEn: "Jasmine", category: "vine", source: "netplant", uses: ["ornamental"] },
  { scientificName: "Pelargonium graveolens", nameFa: "گل شمعدانی", nameEn: "Geranium", category: "flower", source: "imp", uses: ["medicinal"] },
  { scientificName: "Bunium persicum", nameFa: "زیره کوهی", nameEn: "Persian Cumin", category: "herb", source: "imp", uses: ["culinary", "medicinal"] },
  { scientificName: "Ferula assa-foetida", nameFa: "انگدان", nameEn: "Asafoetida", category: "herb", source: "imp", uses: ["culinary", "medicinal"] },
  { scientificName: "Trachyspermum ammi", nameFa: "نجودان", nameEn: "Ajwain", category: "herb", source: "imp", uses: ["medicinal", "culinary"] },
  { scientificName: "Ziziphus jujuba", nameFa: "عناب", nameEn: "Jujube", category: "fruit-tree", source: "netplant", uses: ["medicinal", "culinary"] },
  { scientificName: "Morus alba", nameFa: "توت سفید", nameEn: "White Mulberry", category: "fruit-tree", source: "netplant", uses: ["culinary"] },
  { scientificName: "Juglans regia", nameFa: "گردو", nameEn: "Walnut", category: "nut-tree", source: "netplant", uses: ["culinary"] },
  { scientificName: "Pistacia vera", nameFa: "پسته", nameEn: "Pistachio", category: "nut-tree", source: "netplant", uses: ["culinary"] },
  { scientificName: "Prunus dulcis", nameFa: "بادام", nameEn: "Almond", category: "nut-tree", source: "netplant", uses: ["culinary"] },
  { scientificName: "Spinacia oleracea", nameFa: "اسفناج", nameEn: "Spinach", category: "vegetable", source: "netplant", uses: ["culinary"] },
  { scientificName: "Beta vulgaris", nameFa: "چغندر", nameEn: "Beet", category: "root-vegetable", source: "netplant", uses: ["culinary"] },
  { scientificName: "Daucus carota", nameFa: "هویج", nameEn: "Carrot", category: "root-vegetable", source: "netplant", uses: ["culinary"] },
];

function rowToEntry(row: PersianNameRow): CatalogEntry {
  const category = row.category || "herb";
  const nameEn = row.nameEn || row.scientificName;
  return {
    externalId: `${row.source}-${slugify(row.scientificName)}`,
    slug: slugify(row.scientificName, row.source),
    nameEn,
    nameFa: row.nameFa || getPersianName(nameEn, category),
    scientificName: row.scientificName,
    category,
    categoryFa: getCategoryFa(category),
    description: row.uses?.length ? `کاربرد: ${row.uses.join("، ")}` : null,
    sunRequirement: row.light || null,
    waterRequirement: row.water || "medium",
    soilType: row.soil || null,
    soilPh: null,
    difficulty: null,
    wateringGuide: row.water || null,
    lightGuide: row.light || null,
    fertilizerGuide: null,
    soilGuide: row.soil || null,
    toxicity: null,
    isIndoor: category === "houseplant" || category === "succulent",
    isContainerFriendly: category === "houseplant" || category === "herb",
    usdaZoneMin: null,
    usdaZoneMax: null,
    imageUrl: null,
    source: row.source,
    rawData: JSON.stringify({
      references: {
        netplant: "https://www.netplant.ir/",
        imp: "http://imp.ac.ir/IMP/Home/Plant",
        mmpnd: "https://en.wikipedia.org/wiki/Multilingual_Multiscript_Plant_Name_Database",
      },
      uses: row.uses,
      family: row.family,
    }),
  };
}

export function importPersianSources(dataDir: string): CatalogEntry[] {
  const filePath = join(dataDir, "persian-plants.json");
  const rows: PersianNameRow[] = [...NETPLANT_SEED];

  if (existsSync(filePath)) {
    try {
      const extra = JSON.parse(readFileSync(filePath, "utf8")) as PersianNameRow[];
      rows.push(...extra);
      console.log(`  Loaded ${extra.length} extra Persian names from persian-plants.json`);
    } catch (error) {
      console.warn("  Could not parse persian-plants.json:", error);
    }
  }

  const entries = rows.map(rowToEntry);
  console.log(`Persian sources imported: ${entries.length} plants`);
  return entries;
}
