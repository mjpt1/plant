/**
 * Recommend catalog plants for a measured light band + local weather.
 */

export type LightBand = "dark" | "low" | "medium" | "bright" | "direct";

export type RecommendPlantInput = {
  id: string;
  slug: string;
  nameEn: string;
  nameFa: string;
  scientificName: string | null;
  category: string;
  categoryFa: string;
  sunRequirement: string | null;
  waterRequirement: string | null;
  difficulty: string | null;
  isIndoor: boolean;
  imageUrl: string | null;
  toxicity: string | null;
};

export type WeatherHint = {
  avgTempC?: number | null;
  avgHumidity?: number | null;
  rainNext3DaysMm?: number | null;
  hotClimate?: boolean;
};

function normalizeSun(value: string | null | undefined): LightBand | "unknown" {
  if (!value) return "unknown";
  const v = value.toLowerCase();
  if (
    /dark|shade only|deep shade|سایه کامل|خیلی تاریک/.test(v)
  ) {
    return "dark";
  }
  if (/low|shade|سایه|نور کم|کم‌نور|کم نور/.test(v)) return "low";
  if (
    /direct|full sun|آفتاب کامل|آفتاب مستقیم|high sun/.test(v)
  ) {
    return "direct";
  }
  if (
    /bright|high|غیرمستقیم روشن|آفتاب جزئی|partial sun|full/.test(v)
  ) {
    return "bright";
  }
  if (/medium|moderate|متوسط|partial|نیمه/.test(v)) return "medium";
  return "medium";
}

const BAND_ORDER: LightBand[] = ["dark", "low", "medium", "bright", "direct"];

function bandDistance(a: LightBand, b: LightBand): number {
  return Math.abs(BAND_ORDER.indexOf(a) - BAND_ORDER.indexOf(b));
}

export function scorePlantForConditions(
  plant: RecommendPlantInput,
  light: LightBand,
  weather?: WeatherHint
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 50;

  const plantBand = normalizeSun(plant.sunRequirement);
  if (plantBand === "unknown") {
    score += 5;
    reasons.push("light_unknown");
  } else {
    const dist = bandDistance(plantBand, light);
    if (dist === 0) {
      score += 35;
      reasons.push("light_match");
    } else if (dist === 1) {
      score += 18;
      reasons.push("light_near");
    } else if (dist === 2) {
      score -= 5;
      reasons.push("light_stretch");
    } else {
      score -= 25;
      reasons.push("light_mismatch");
    }
  }

  if (plant.isIndoor && light !== "direct") {
    score += 8;
    reasons.push("indoor_fit");
  }

  const water = (plant.waterRequirement || "").toLowerCase();
  const hot = Boolean(weather?.hotClimate) || (weather?.avgTempC ?? 0) >= 30;
  const humid = (weather?.avgHumidity ?? 50) >= 65;
  const rainy = (weather?.rainNext3DaysMm ?? 0) >= 8;

  if (hot) {
    if (/low|dry|کم|خشک/.test(water)) {
      score += 12;
      reasons.push("drought_tolerant");
    } else if (/high|moist|زیاد|مرطوب/.test(water)) {
      score -= 8;
      reasons.push("high_water_hot");
    }
  }

  if (humid && /high|moist|زیاد|مرطوب/.test(water)) {
    score += 6;
    reasons.push("humidity_ok");
  }

  if (rainy && /high|moist|زیاد|مرطوب/.test(water)) {
    score += 4;
    reasons.push("rain_ok");
  }

  const diff = (plant.difficulty || "").toLowerCase();
  if (/easy|beginner|آسان|مبتدی/.test(diff)) {
    score += 6;
    reasons.push("easy");
  }

  if (/toxic|سمی|poison/.test((plant.toxicity || "").toLowerCase())) {
    score -= 3;
    reasons.push("toxicity_note");
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

export function reasonLabel(reason: string, locale: "en" | "fa"): string {
  const map: Record<string, { fa: string; en: string }> = {
    light_match: { fa: "هم‌خوان با نور محل شما", en: "Matches your light level" },
    light_near: { fa: "نزدیک به نور محل شما", en: "Close to your light level" },
    light_stretch: { fa: "نور کمی متفاوت — قابل‌تنظیم", en: "Slight light stretch" },
    light_mismatch: { fa: "نور محل ممکن است مناسب نباشد", en: "Light may not suit this plant" },
    light_unknown: { fa: "نیاز نوری در کاتالوگ نامشخص", en: "Catalog light need unknown" },
    indoor_fit: { fa: "مناسب فضای داخلی", en: "Good indoor candidate" },
    drought_tolerant: { fa: "تحمل خشکی برای هوای گرم", en: "Drought-tolerant for hot weather" },
    high_water_hot: { fa: "در گرما به آبیاری بیشتری نیاز دارد", en: "Needs more water in heat" },
    humidity_ok: { fa: "با رطوبت فعلی سازگار است", en: "Fits current humidity" },
    rain_ok: { fa: "با بارندگی پیش‌رو سازگار است", en: "OK with upcoming rain" },
    easy: { fa: "مراقبت آسان برای مبتدی", en: "Easy care for beginners" },
    toxicity_note: { fa: "به سمیت برای حیوان/کودک توجه کنید", en: "Check pet/child toxicity" },
  };
  const hit = map[reason];
  if (!hit) return reason;
  return locale === "fa" ? hit.fa : hit.en;
}
