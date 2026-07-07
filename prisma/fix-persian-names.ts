/**
 * Updates nameFa for catalog entries where Persian name equals English name.
 * Run: npm run catalog:fix-fa
 */
import { PrismaClient } from "@prisma/client";
import { getPersianName } from "../src/data/plantNames";

const prisma = new PrismaClient();

async function main() {
  const plants = await prisma.plantCatalog.findMany({
    select: { id: true, nameEn: true, nameFa: true, category: true },
  });

  const updates: Array<{ id: string; nameFa: string }> = [];

  for (const p of plants) {
    if (p.nameFa !== p.nameEn) continue;
    const fa = getPersianName(p.nameEn, p.category);
    if (fa === p.nameEn) continue;
    updates.push({ id: p.id, nameFa: fa });
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
