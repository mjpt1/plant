export interface CatalogEntry {
  externalId: string;
  slug: string;
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
  isIndoor: boolean;
  isContainerFriendly: boolean;
  usdaZoneMin: number | null;
  usdaZoneMax: number | null;
  imageUrl: string | null;
  source: string;
  rawData: string | null;
}

export function slugify(text: string, prefix = ""): string {
  const base = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const safe = base || "plant";
  return prefix ? `${prefix}-${safe}` : safe;
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function dedupeCatalog(entries: CatalogEntry[]): CatalogEntry[] {
  const byScientific = new Map<string, CatalogEntry>();
  const priority: Record<string, number> = {
    plantsolve: 4,
    bripatch: 3,
    netplant: 2,
    imp: 2,
    wcvp: 1,
  };

  for (const entry of entries) {
    const key = (entry.scientificName || entry.nameEn).trim().toLowerCase();
    if (!key) continue;
    const existing = byScientific.get(key);
    if (!existing) {
      byScientific.set(key, entry);
      continue;
    }
    const existingScore = priority[existing.source] ?? 0;
    const nextScore = priority[entry.source] ?? 0;
    if (nextScore > existingScore) {
      byScientific.set(key, {
        ...entry,
        nameFa: entry.nameFa || existing.nameFa,
        description: entry.description || existing.description,
        imageUrl: entry.imageUrl || existing.imageUrl,
      });
    } else if (entry.nameFa && existing.nameFa === existing.nameEn) {
      byScientific.set(key, { ...existing, nameFa: entry.nameFa });
    }
  }

  const bySlug = new Map<string, CatalogEntry>();
  for (const entry of Array.from(byScientific.values())) {
    let slug = entry.slug;
    let suffix = 2;
    while (bySlug.has(slug)) {
      slug = `${entry.slug}-${suffix}`;
      suffix++;
    }
    bySlug.set(slug, { ...entry, slug });
  }

  return Array.from(bySlug.values());
}
