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

const ISSUES: Record<
  string,
  { fa: { problems: string[]; diseases: string[]; pests: string[] }; en: { problems: string[]; diseases: string[]; pests: string[] } }
> = {
  houseplant: {
    fa: {
      problems: [
        "زردی برگ‌ها (ممکن است آبیاری، نور یا کمبود عناصر باشد)",
        "لبهٔ خشک برگ (نمک، کم‌آبی یا رطوبت کم)",
        "پژمردگی (ریشهٔ پوسیده یا کم‌آبی شدید)",
      ],
      diseases: [
        "لکه‌های قارچی روی برگ",
        "پوسیدگی ریشه در خاک بسیار مرطوب",
        "باکتریوز برگی (لبهٔ تیره و چروکیده)",
      ],
      pests: ["شپشک آردی", "شته", "کنه تار عنکبوتی", "سوسک برگ"],
    },
    en: {
      problems: [
        "Yellowing leaves (watering, light, or nutrients)",
        "Crispy leaf edges (salt, underwatering, or low humidity)",
        "Wilting (root rot or severe drought)",
      ],
      diseases: [
        "Fungal leaf spots",
        "Root rot in waterlogged soil",
        "Bacterial leaf spot (dark, water-soaked margins)",
      ],
      pests: ["Mealybugs", "Aphids", "Spider mites", "Scale insects"],
    },
  },
  succulent: {
    fa: {
      problems: ["برگ‌های نرم و شفاف (آبیاری زیاد)", "کشیده شدن ساقه (نور کم)"],
      diseases: ["پوسیدگی پایه ساقه", "قارچ سیاه روی برگ"],
      pests: ["شپشک آردی", "کنه"],
    },
    en: {
      problems: ["Soft translucent leaves (overwatering)", "Etiolated stretch (low light)"],
      diseases: ["Stem base rot", "Black fungal spots on leaves"],
      pests: ["Mealybugs", "Mites"],
    },
  },
  herb: {
    fa: {
      problems: ["زردی بین رگبرگ‌ها (کمبود آهن)", "سوختگی برگ (آفتاب شدید)"],
      diseases: ["سفیدک پودری", "زنگ زرد"],
      pests: ["شته", "کرم سبز"],
    },
    en: {
      problems: ["Interveinal yellowing (iron deficiency)", "Leaf scorch (intense sun)"],
      diseases: ["Powdery mildew", "Rust"],
      pests: ["Aphids", "Caterpillars"],
    },
  },
  default: {
    fa: {
      problems: [
        "تغییر رنگ برگ بدون علت مشخص",
        "لکه، پوسیدگی یا چروکیدگی غیرعادی",
      ],
      diseases: [
        "عفونت قارچی (لکه‌های گرد قهوه‌ای یا سیاه)",
        "باکتریوز (لبهٔ تیره و مرطوب)",
        "ویروس (الگوی موزاییکی روی برگ)",
      ],
      pests: ["شته", "شپشک آردی", "کنه", "حشرات جویدنی"],
    },
    en: {
      problems: [
        "Unexplained leaf discoloration",
        "Spots, rot, or abnormal wilting",
      ],
      diseases: [
        "Fungal infection (round brown/black spots)",
        "Bacterial blight (dark water-soaked edges)",
        "Viral mosaic patterns on leaves",
      ],
      pests: ["Aphids", "Mealybugs", "Mites", "Chewing insects"],
    },
  },
};

function pickCategoryKey(category?: string): string {
  if (!category) return "default";
  const c = category.toLowerCase();
  if (c.includes("succulent") || c.includes("cactus")) return "succulent";
  if (c.includes("herb")) return "herb";
  if (
    c.includes("house") ||
    c.includes("indoor") ||
    c.includes("flower") ||
    c.includes("vine")
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
    imageType === "full_plant"
  );
}

export function getHeuristicHealthAssessment(
  imageType: ImageScanType | undefined,
  category: string | undefined,
  locale: Locale
): HeuristicHealth | null {
  if (!needsVisualHealthAssessment(imageType)) return null;

  const key = pickCategoryKey(category);
  const pack = ISSUES[key] || ISSUES.default;
  const lang = locale === "fa" ? pack.fa : pack.en;

  const note =
    locale === "fa"
      ? "این موارد رایج هستند — برای تشخیص دقیق از تصویر نزدیک برگ آسیب‌دیده استفاده کنید یا سرویس تحلیل بصری فعال کنید."
      : "These are common possibilities — use a close-up of affected tissue for a precise diagnosis, or enable vision analysis.";

  if (imageType === "pest") {
    return {
      status: "warning",
      possibleProblems: lang.problems.slice(0, 2),
      diseaseDiagnosis: [],
      pestDiagnosis: lang.pests,
      soilAnalysis: note,
      confidence: 25,
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

  if (imageType === "full_plant") {
    return {
      status: "unknown",
      possibleProblems: lang.problems.slice(0, 3),
      diseaseDiagnosis: [],
      pestDiagnosis: [],
      soilAnalysis: note,
      confidence: 20,
    };
  }

  return {
    status: "warning",
    possibleProblems: lang.problems,
    diseaseDiagnosis: lang.diseases,
    pestDiagnosis: lang.pests.slice(0, 2),
    soilAnalysis: note,
    confidence: 30,
  };
}
