import { prisma } from "@/lib/prisma";

export type CatalogMatch = {
  id: string;
  nameEn: string;
  nameFa: string;
  scientificName: string | null;
  category: string;
  categoryFa: string;
  description: string | null;
  sunRequirement: string | null;
  waterRequirement: string | null;
  soilType: string | null;
  soilPh: string | null;
  difficulty: string | null;
  wateringGuide: string | null;
  lightGuide: string | null;
  fertilizerGuide: string | null;
  soilGuide: string | null;
  toxicity: string | null;
  family: string | null;
  uses: string | null;
  lifeform: string | null;
  climate: string | null;
  geographicArea: string | null;
};

type CatalogRaw = {
  family?: string;
  uses?: string[] | string;
  lifeform?: string;
  climate?: string;
  geographic_area?: string;
  inIran?: boolean;
};

const CATALOG_SELECT = {
  id: true,
  nameEn: true,
  nameFa: true,
  scientificName: true,
  category: true,
  categoryFa: true,
  description: true,
  sunRequirement: true,
  waterRequirement: true,
  soilType: true,
  soilPh: true,
  difficulty: true,
  wateringGuide: true,
  lightGuide: true,
  fertilizerGuide: true,
  soilGuide: true,
  toxicity: true,
  rawData: true,
} as const;

function parseRawData(raw: unknown): CatalogRaw | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as CatalogRaw;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw as CatalogRaw;
  return null;
}

function formatUses(uses: CatalogRaw["uses"], locale?: string): string | null {
  if (!uses) return null;
  if (Array.isArray(uses)) {
    const labels =
      locale === "fa"
        ? uses.map((u) => {
            const map: Record<string, string> = {
              medicinal: "دارویی",
              culinary: "خوراکی / آشپزی",
              ornamental: "زینتی",
              aromatic: "معطر",
            };
            return map[u] || u;
          })
        : uses;
    return labels.join(locale === "fa" ? "، " : ", ");
  }
  return String(uses);
}

function enrichMatch(
  row: {
    id: string;
    nameEn: string;
    nameFa: string;
    scientificName: string | null;
    category: string;
    categoryFa: string;
    description: string | null;
    sunRequirement: string | null;
    waterRequirement: string | null;
    soilType: string | null;
    soilPh: string | null;
    difficulty: string | null;
    wateringGuide: string | null;
    lightGuide: string | null;
    fertilizerGuide: string | null;
    soilGuide: string | null;
    toxicity: string | null;
    rawData: unknown;
  },
  locale?: string
): CatalogMatch {
  const raw = parseRawData(row.rawData);
  let uses = formatUses(raw?.uses, locale);

  if (!uses && row.description?.startsWith("کاربرد:")) {
    uses = row.description.replace(/^کاربرد:\s*/, "").trim();
  }

  return {
    id: row.id,
    nameEn: row.nameEn,
    nameFa: row.nameFa,
    scientificName: row.scientificName,
    category: row.category,
    categoryFa: row.categoryFa,
    description: row.description,
    sunRequirement: row.sunRequirement,
    waterRequirement: row.waterRequirement,
    soilType: row.soilType,
    soilPh: row.soilPh,
    difficulty: row.difficulty,
    wateringGuide: row.wateringGuide,
    lightGuide: row.lightGuide,
    fertilizerGuide: row.fertilizerGuide,
    soilGuide: row.soilGuide,
    toxicity: row.toxicity,
    family: raw?.family || null,
    uses,
    lifeform: raw?.lifeform || null,
    climate: raw?.climate || null,
    geographicArea: raw?.geographic_area || null,
  };
}

export async function findCatalogByScientificName(
  scientificName: string,
  locale?: string
): Promise<CatalogMatch | null> {
  const trimmed = scientificName.trim();
  if (!trimmed) return null;

  const exact = await prisma.plantCatalog.findFirst({
    where: {
      scientificName: { equals: trimmed, mode: "insensitive" },
      isApproved: true,
    },
    select: CATALOG_SELECT,
  });
  if (exact) return enrichMatch(exact, locale);

  const genus = trimmed.split(/\s+/)[0];
  if (!genus) return null;

  const genusMatches = await prisma.plantCatalog.findMany({
    where: {
      scientificName: { startsWith: genus, mode: "insensitive" },
      isApproved: true,
    },
    take: 20,
    orderBy: { nameEn: "asc" },
    select: CATALOG_SELECT,
  });

  if (genusMatches.length === 0) return null;

  const preferred =
    genusMatches.find((row) => row.description && row.description.length > 40) ||
    genusMatches.find((row) => row.wateringGuide || row.lightGuide) ||
    genusMatches[0];

  return enrichMatch(preferred, locale);
}
