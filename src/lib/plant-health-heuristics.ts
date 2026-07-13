import type { Locale } from "@/i18n";
import type { ImageScanType } from "@/types/analysis";

type HeuristicHealth = {
  status: "unknown" | "warning";
  possibleProblems: string[];
  diseaseDiagnosis: string[];
  pestDiagnosis: string[];
  soilAnalysis: string;
  confidence: number;
};

const HINTS: Record<
  string,
  { fa: { problems: string[]; pests: string[] }; en: { problems: string[]; pests: string[] } }
> = {
  houseplant: {
    fa: {
      problems: [
        "زردی برگ‌ها (ممکن است آبیاری، نور یا کمبود عناصر باشد)",
        "لبهٔ خشک برگ (نمک، کم‌آبی یا رطوبت کم)",
        "پژمردگی (ریشهٔ پوسیده یا کم‌آبی شدید)",
      ],
      pests: ["شپشک آردی", "شته", "کنه تار عنکبوتی"],
    },
    en: {
      problems: [
        "Yellowing leaves (watering, light, or nutrients)",
        "Crispy leaf edges (salt, underwatering, or low humidity)",
        "Wilting (root rot or severe drought)",
      ],
      pests: ["Mealybugs", "Aphids", "Spider mites"],
    },
  },
  succulent: {
    fa: {
      problems: ["برگ‌های نرم و شفاف (آبیاری زیاد)", "کشیده شدن ساقه (نور کم)"],
      pests: ["شپشک آردی", "کنه"],
    },
    en: {
      problems: ["Soft translucent leaves (overwatering)", "Etiolated stretch (low light)"],
      pests: ["Mealybugs", "Mites"],
    },
  },
  herb: {
    fa: {
      problems: ["زردی بین رگبرگ‌ها (کمبود آهن)", "سوختگی برگ (آفتاب شدید)"],
      pests: ["شته", "کرم سبز"],
    },
    en: {
      problems: ["Interveinal yellowing (iron deficiency)", "Leaf scorch (intense sun)"],
      pests: ["Aphids", "Caterpillars"],
    },
  },
  default: {
    fa: {
      problems: [
        "تغییر رنگ برگ بدون علت مشخص",
        "لکه، پوسیدگی یا چروکیدگی غیرعادی",
      ],
      pests: ["شته", "شپشک آردی", "کنه"],
    },
    en: {
      problems: [
        "Unexplained leaf discoloration",
        "Spots, rot, or abnormal wilting",
      ],
      pests: ["Aphids", "Mealybugs", "Mites"],
    },
  },
};

function pickCategoryKey(category?: string): string {
  if (!category) return "default";
  const c = category.toLowerCase();
  if (
    c.includes("succulent") ||
    c.includes("cactus") ||
    c.includes("ساکولنت") ||
    c.includes("کاکتوس")
  ) {
    return "succulent";
  }
  if (c.includes("herb") || c.includes("سبزی") || c.includes("دارویی")) {
    return "herb";
  }
  if (
    c.includes("house") ||
    c.includes("indoor") ||
    c.includes("flower") ||
    c.includes("vine") ||
    c.includes("آپارتمان") ||
    c.includes("زینتی") ||
    c.includes("گل") ||
    c.includes("خانگی")
  ) {
    return "houseplant";
  }
  return "default";
}

export function needsVisualHealthAssessment(imageType?: string): boolean {
  return (
    imageType === "leaf" ||
    imageType === "stem" ||
    imageType === "pest" ||
    imageType === "fruit" ||
    imageType === "root" ||
    imageType === "flower" ||
    imageType === "full_plant"
  );
}

/**
 * Conservative fallback when no vision LLM is available.
 * Never invents a disease list from thin air — guides the user instead.
 */
export function getHeuristicHealthAssessment(
  imageType: ImageScanType | undefined,
  category: string | undefined,
  locale: Locale
): HeuristicHealth | null {
  if (!needsVisualHealthAssessment(imageType)) return null;

  const key = pickCategoryKey(category);
  const pack = HINTS[key] || HINTS.default;
  const lang = locale === "fa" ? pack.fa : pack.en;

  const visionNeeded =
    locale === "fa"
      ? "برای تشخیص بیماری واقعی به سرویس تحلیل تصویری (Gemini/OpenAI) و عکس نزدیک از ناحیهٔ آسیب نیاز است. فعلاً فقط فرضیه‌های مراقبتی نمایش داده می‌شود."
      : "Real disease diagnosis needs a vision service (Gemini/OpenAI) and a close-up of affected tissue. Showing care hypotheses only for now.";

  if (imageType === "pest") {
    return {
      status: "warning",
      possibleProblems: lang.problems.slice(0, 2),
      diseaseDiagnosis: [],
      pestDiagnosis: lang.pests,
      soilAnalysis: visionNeeded,
      confidence: 22,
    };
  }

  if (imageType === "soil") {
    return {
      status: "unknown",
      possibleProblems: [],
      diseaseDiagnosis: [],
      pestDiagnosis: [],
      soilAnalysis:
        locale === "fa"
          ? "از تصویر خاک نمی‌توان بیماری را تشخیص داد؛ بافت، بوی و رطوبت خاک را دستی بررسی کنید."
          : "Soil photos cannot confirm disease — check texture, smell, and moisture by hand.",
      confidence: 20,
    };
  }

  // leaf / stem / fruit / root / flower / full_plant — no fake disease dump
  return {
    status: "unknown",
    possibleProblems: lang.problems.slice(0, 3),
    diseaseDiagnosis: [],
    pestDiagnosis: [],
    soilAnalysis: visionNeeded,
    confidence: 18,
  };
}
