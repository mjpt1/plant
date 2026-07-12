import { prisma } from "@/lib/prisma";
import {
  computeWateringAdjustment,
  fetchWeatherForLocation,
} from "@/lib/weather";

export async function recordCareOutcome(input: {
  userId: string;
  plantId: string | null;
  reminderId: string;
  type: string;
  scheduledAt: Date;
  completedAt?: Date;
}) {
  const completedAt = input.completedAt || new Date();
  const deltaMs = completedAt.getTime() - input.scheduledAt.getTime();
  const deltaDays = Math.round(deltaMs / (24 * 60 * 60 * 1000));

  let weatherTemp: number | null = null;
  let weatherHumidity: number | null = null;
  let weatherRainMm: number | null = null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { city: true, country: true },
    });
    if (user?.city && user?.country) {
      const weather = await fetchWeatherForLocation(user.city, user.country);
      if (weather) {
        const insight = computeWateringAdjustment(weather);
        weatherTemp = insight.avgTempNext3Days;
        weatherHumidity = insight.avgHumidityNext3Days;
        weatherRainMm = insight.rainNext3DaysMm;
      }
    }
  } catch {
    // Weather is optional for outcome logging.
  }

  return prisma.careOutcome.create({
    data: {
      userId: input.userId,
      plantId: input.plantId,
      reminderId: input.reminderId,
      type: input.type,
      scheduledAt: input.scheduledAt,
      completedAt,
      deltaDays,
      weatherTemp,
      weatherHumidity,
      weatherRainMm,
    },
  });
}
