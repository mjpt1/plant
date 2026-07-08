/**
 * Updates nameFa for catalog entries with missing or transliterated Persian names.
 * Run: npm run catalog:fix-fa
 */
import { PrismaClient } from "@prisma/client";
import { resolveBilingualNames } from "../src/lib/plant-locale";

const prisma = new PrismaClient();

async function main() {
  const plants = await prisma.plantCatalog.findMany({
    select: {
      id: true,
      nameEn: true,
      nameFa: true,
      scientificName: true,
      category: true,
    },
  });

  const updates: Array<{ id: string; nameFa: string }> = [];

  for (const p of plants) {
    const { nameFa } = resolveBilingualNames(
      p.nameEn,
      p.nameFa,
      p.scientificName,
      p.category
    );
    if (nameFa === p.nameFa) continue;
    updates.push({ id: p.id, nameFa });
  }

  console.log(`Updating ${updates.length} of ${plants.length} catalog entries...`);

  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await Promise.all(
      batch.map((u) =>
        prisma.plantCatalog.update({
          where: { id: u.id },
          data: { nameFa: u.nameFa },
        })
      )
    );
    console.log(`  ${Math.min(i + batchSize, updates.length)}/${updates.length}`);
  }

  console.log(`✅ Updated ${updates.length} Persian names`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
