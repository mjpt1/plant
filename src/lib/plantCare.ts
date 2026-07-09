import { prisma } from "@/lib/prisma";
import {
  buildCarePlan,
  generateRemindersFromPlan,
} from "@/lib/carePlan";
import type { CareGuideItem } from "@/types";
import { parseJson, toJsonValue } from "@/lib/jsonFields";
import { fetchWeatherForLocation } from "@/lib/weather";

export async function applyCarePlan(plantId: string, userId: string) {
  const [plant, user] = await Promise.all([
    prisma.plant.findUnique({ where: { id: plantId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { country: true, city: true },
    }),
  ]);

  if (!plant || plant.userId !== userId) return null;

  const country = user?.country || "Iran";
  const city = user?.city || "Tehran";
  const careGuide = parseJson<CareGuideItem | null>(plant.careGuide, null);
  const weather = await fetchWeatherForLocation(city, country);

  const { tasks, climate } = buildCarePlan({
    plantNameEn: plant.nameEn,
    plantNameFa: plant.nameFa,
    healthStatus: plant.healthStatus,
    environment: plant.environment,
    country,
    city,
    careGuide,
    weather,
  });

  await prisma.plant.update({
    where: { id: plantId },
    data: { carePlan: toJsonValue({ tasks, climate }) },
  });

  await prisma.careReminder.deleteMany({
    where: { plantId, userId, completed: false },
  });

  const reminderData = generateRemindersFromPlan(
    tasks,
    plantId,
    userId,
    90,
    weather
  );
  if (reminderData.length > 0) {
    await prisma.careReminder.createMany({
      data: reminderData.map((r) => ({
        userId: r.userId,
        plantId: r.plantId,
        titleEn: r.titleEn,
        titleFa: r.titleFa,
        type: r.type,
        scheduledAt: r.scheduledAt,
        recurring: r.recurring,
        notes: r.notes,
      })),
    });
  }

  return { tasks, climate, weather };
}

export async function regenerateAllCarePlansForUser(userId: string) {
  const plants = await prisma.plant.findMany({
    where: { userId },
    select: { id: true },
  });

  const results = [];
  for (const plant of plants) {
    const result = await applyCarePlan(plant.id, userId);
    if (result) results.push(plant.id);
  }
  return results;
}
