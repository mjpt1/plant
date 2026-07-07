import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function seedCatalog() {
  const catalogPath = join(process.cwd(), "prisma", "data", "plant-catalog.json");

  if (!existsSync(catalogPath)) {
    console.log("⚠️  plant-catalog.json not found. Run: npm run catalog:import");
    return;
  }

  const catalog = JSON.parse(readFileSync(catalogPath, "utf-8")) as Array<{
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
  }>;

  console.log(`Seeding ${catalog.length} catalog plants...`);
  const existing = await prisma.plantCatalog.count();
  if (existing > 0) {
    console.log(`Catalog already has ${existing} entries, skipping.`);
    return;
  }

  const batchSize = 200;
  for (let i = 0; i < catalog.length; i += batchSize) {
    const batch = catalog.slice(i, i + batchSize);
    await prisma.plantCatalog.createMany({
      data: batch.map((item) => ({
        ...item,
        rawData: item.rawData ? JSON.parse(item.rawData) : null,
      })),
    });
    console.log(`  ${Math.min(i + batchSize, catalog.length)}/${catalog.length}`);
  }

  console.log("✅ Plant catalog seeded!");
}

seedCatalog()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
