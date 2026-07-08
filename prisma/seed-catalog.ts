import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

type CatalogRow = {
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
};

function toDbRow(item: CatalogRow) {
  return {
    ...item,
    rawData: item.rawData ? JSON.parse(item.rawData) : null,
  };
}

async function seedCatalog() {
  const catalogPath = join(process.cwd(), "prisma", "data", "plant-catalog.json");
  const force = process.argv.includes("--force");

  if (!existsSync(catalogPath)) {
    console.log("⚠️  plant-catalog.json not found. Run: npm run catalog:import");
    return;
  }

  const catalog = JSON.parse(readFileSync(catalogPath, "utf-8")) as CatalogRow[];
  const existing = await prisma.plantCatalog.count();

  if (existing > 0 && !force) {
    console.log(
      `Catalog already has ${existing} entries. Run with --force to rebuild from JSON.`
    );
    return;
  }

  if (force && existing > 0) {
    console.log(`Clearing ${existing} existing catalog entries...`);
    await prisma.plantCatalog.deleteMany({});
  }

  console.log(`Seeding ${catalog.length} catalog plants...`);

  const batchSize = 500;
  for (let i = 0; i < catalog.length; i += batchSize) {
    const batch = catalog.slice(i, i + batchSize);
    await prisma.plantCatalog.createMany({
      data: batch.map(toDbRow),
      skipDuplicates: true,
    });
    console.log(`  ${Math.min(i + batchSize, catalog.length)}/${catalog.length}`);
  }

  const total = await prisma.plantCatalog.count();
  console.log(`✅ Plant catalog ready — ${total} entries in database`);
}

seedCatalog()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
