import type { CareGuideItem } from "@/types";

export interface CarePlanTask {
  type: "watering" | "fertilizing" | "pruning" | "inspection" | "repotting";
  intervalDays: number;
  titleEn: string;
  titleFa: string;
  notesEn: string;
  notesFa: string;
}

export interface ClimateProfile {
  wateringMultiplier: number;
  labelEn: string;
  labelFa: string;
}

export interface GeneratedReminder {
  type: string;
  titleEn: string;
  titleFa: string;
  scheduledAt: Date;
  recurring: string;
  notes: string | null;
}

const IRAN_CITIES = [
  "tehran", "تهران", "isfahan", "اصفهان", "shiraz", "شیراز", "mashhad", "مشهد",
  "tabriz", "تبریز", "ahvaz", "اهواز", "kerman", "کرمان", "yazd", "یزد",
];

const HOT_CLIMATE_COUNTRIES = [
  "iran", "ایران", "uae", "emirates", "saudi", "qatar", "kuwait", "bahrain",
  "oman", "iraq", "عراق", "egypt", "مصر",
];

const TEMPERATE_COUNTRIES = [
  "germany", "france", "uk", "britain", "canada", "netherlands", "آلمان", "فرانسه",
];

const HUMID_TROPICAL = [
  "india", "thailand", "indonesia", "brazil", "هند", "تایلند",
];

export function getClimateProfile(country: string, city: string): ClimateProfile {
  const c = country.toLowerCase().trim();
  const cityLower = city.toLowerCase().trim();

  if (HOT_CLIMATE_COUNTRIES.some((x) => c.includes(x))) {
    const isDryCity = IRAN_CITIES.some((x) => cityLower.includes(x)) || c.includes("saudi") || c.includes("uae");
    return {
      wateringMultiplier: isDryCity ? 1.4 : 1.5,
      labelEn: "Hot & dry climate — more frequent watering",
      labelFa: "آب‌وهوای گرم و خشک — آبیاری بیشتر",
    };
  }

  if (HUMID_TROPICAL.some((x) => c.includes(x))) {
    return {
      wateringMultiplier: 1.2,
      labelEn: "Humid tropical — moderate watering, watch for fungus",
      labelFa: "هوای مرطوب گرمسیری — آبیاری متوسط، مراقب قارچ باشید",
    };
  }

  if (TEMPERATE_COUNTRIES.some((x) => c.includes(x))) {
    return {
      wateringMultiplier: 0.85,
      labelEn: "Temperate climate — less watering in winter",
      labelFa: "آب‌وهوای معتدل — در زمستان آبیاری کمتر",
    };
  }

  return {
    wateringMultiplier: 1.0,
    labelEn: "Standard climate schedule",
    labelFa: "برنامه استاندارد بر اساس موقعیت",
  };
}

function baseWateringDays(health: string, environment: string): number {
  let days = 7;
  if (health === "warning") days = 5;
  if (health === "critical") days = 3;
  if (environment === "outdoor") days -= 1;
  if (environment === "balcony") days -= 0;
  return Math.max(2, days);
}

function baseFertilizeDays(health: string): number {
  if (health === "critical") return 21;
  if (health === "warning") return 25;
  return 30;
}

export function buildCarePlan(input: {
  plantNameEn: string;
  plantNameFa: string;
  healthStatus: string;
  environment: string;
  country: string;
  city: string;
  careGuide?: CareGuideItem | null;
}): { tasks: CarePlanTask[]; climate: ClimateProfile } {
  const climate = getClimateProfile(input.country, input.city);
  const waterDays = Math.max(
    2,
    Math.round(baseWateringDays(input.healthStatus, input.environment) / climate.wateringMultiplier)
  );
  const fertilizeDays = baseFertilizeDays(input.healthStatus);

  const tasks: CarePlanTask[] = [
    {
      type: "watering",
      intervalDays: waterDays,
      titleEn: `Water ${input.plantNameEn}`,
      titleFa: `آبیاری ${input.plantNameFa}`,
      notesEn: input.careGuide?.watering || `Every ${waterDays} days based on your local climate.`,
      notesFa: input.careGuide?.watering || `هر ${waterDays} روز بر اساس آب‌وهوای محلی شما.`,
    },
    {
      type: "fertilizing",
      intervalDays: fertilizeDays,
      titleEn: `Fertilize ${input.plantNameEn}`,
      titleFa: `کوددهی ${input.plantNameFa}`,
      notesEn: input.careGuide?.fertilizer || `Every ${fertilizeDays} days during growing season.`,
      notesFa: input.careGuide?.fertilizer || `هر ${fertilizeDays} روز در فصل رشد.`,
    },
  ];

  if (input.healthStatus === "warning" || input.healthStatus === "critical") {
    tasks.push({
      type: "inspection",
      intervalDays: input.healthStatus === "critical" ? 1 : 3,
      titleEn: `Health check: ${input.plantNameEn}`,
      titleFa: `بررسی سلامت: ${input.plantNameFa}`,
      notesEn: "Inspect leaves, soil moisture, and pests.",
      notesFa: "برگ‌ها، رطوبت خاک و آفات را بررسی کنید.",
    });
  }

  if (input.healthStatus === "healthy") {
    tasks.push({
      type: "pruning",
      intervalDays: 60,
      titleEn: `Prune ${input.plantNameEn}`,
      titleFa: `هرس ${input.plantNameFa}`,
      notesEn: "Remove dead leaves and shape the plant.",
      notesFa: "برگ‌های خشک را بردارید و گیاه را مرتب کنید.",
    });
  }

  tasks.push({
    type: "repotting",
    intervalDays: 365,
    titleEn: `Check repotting: ${input.plantNameEn}`,
    titleFa: `بررسی تعویض گلدان: ${input.plantNameFa}`,
    notesEn: input.careGuide?.soil || "Check if roots are crowded.",
    notesFa: input.careGuide?.soil || "بررسی کنید ریشه‌ها شلوغ نشده باشند.",
  });

  return { tasks, climate };
}

export function generateRemindersFromPlan(
  tasks: CarePlanTask[],
  plantId: string,
  userId: string,
  horizonDays = 90
): Array<GeneratedReminder & { plantId: string; userId: string }> {
  const reminders: Array<GeneratedReminder & { plantId: string; userId: string }> = [];
  const now = new Date();
  const end = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  for (const task of tasks) {
    let next = new Date(now);
    next.setHours(9, 0, 0, 0);

    if (task.type === "watering") {
      next.setDate(next.getDate() + 1);
    } else if (task.type === "fertilizing") {
      next.setDate(next.getDate() + task.intervalDays);
    } else {
      next.setDate(next.getDate() + Math.min(task.intervalDays, 7));
    }

    let count = 0;
    while (next <= end && count < 12) {
      reminders.push({
        plantId,
        userId,
        type: task.type,
        titleEn: task.titleEn,
        titleFa: task.titleFa,
        scheduledAt: new Date(next),
        recurring:
          task.intervalDays <= 7
            ? "weekly"
            : task.intervalDays <= 14
            ? "weekly"
            : task.intervalDays <= 31
            ? "monthly"
            : "monthly",
        notes: task.notesFa,
      });

      next = new Date(next.getTime() + task.intervalDays * 24 * 60 * 60 * 1000);
      count++;
    }
  }

  return reminders.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}
