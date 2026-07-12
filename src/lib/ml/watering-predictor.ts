import { prisma } from "@/lib/prisma";

export type WateringPredictionInput = {
  userId: string;
  plantId: string;
  baseIntervalDays: number;
  climateMultiplier: number;
  weatherAdjustment?: number;
  environment?: string;
  healthStatus?: string;
};

export type WateringPrediction = {
  intervalDays: number;
  source: "rules" | "ml_personal";
  sampleSize: number;
  reasonEn: string;
  reasonFa: string;
};

const MIN_SAMPLES = 3;
const MIN_INTERVAL = 2;
const MAX_INTERVAL = 45;

/**
 * Phase-3 stub: personalize watering interval from CareOutcome history.
 * With enough completed waterings, use median actual gap; else keep rules.
 */
export async function predictWateringIntervalDays(
  input: WateringPredictionInput
): Promise<WateringPrediction> {
  const ruleInterval = Math.max(
    MIN_INTERVAL,
    Math.min(MAX_INTERVAL, Math.round(input.baseIntervalDays))
  );

  try {
    const outcomes = await prisma.careOutcome.findMany({
      where: {
        userId: input.userId,
        plantId: input.plantId,
        type: "watering",
      },
      orderBy: { completedAt: "desc" },
      take: 12,
      select: { deltaDays: true },
    });

    const gaps = outcomes
      .map((o) => o.deltaDays)
      .filter((d) => d !== null && d >= 1 && d <= MAX_INTERVAL) as number[];

    if (gaps.length < MIN_SAMPLES) {
      return {
        intervalDays: ruleInterval,
        source: "rules",
        sampleSize: gaps.length,
        reasonEn: "Not enough watering history — using climate rules",
        reasonFa: "تاریخچه آبیاری کافی نیست — از قوانین اقلیم استفاده شد",
      };
    }

    const sorted = [...gaps].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    // Blend median behavior with climate-aware rules (70% personal / 30% rules)
    const blended = Math.round(median * 0.7 + ruleInterval * 0.3);
    const intervalDays = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, blended));

    return {
      intervalDays,
      source: "ml_personal",
      sampleSize: gaps.length,
      reasonEn: `Personalized from ${gaps.length} watering completions`,
      reasonFa: `شخصی‌سازی‌شده از ${gaps.length} آبیاری ثبت‌شده`,
    };
  } catch {
    return {
      intervalDays: ruleInterval,
      source: "rules",
      sampleSize: 0,
      reasonEn: "Predictor unavailable — using climate rules",
      reasonFa: "پیش‌بینی در دسترس نیست — از قوانین اقلیم استفاده شد",
    };
  }
}
