import type { Locale } from "@/i18n";
import {
  PERSIAN_PLANT_NAMES,
  getCategoryFa,
  getPersianName,
} from "@/data/plantNames";
import { formatBotanicalFamily } from "@/lib/botanical-family";
import type { PlantAnalysis } from "@/types/analysis";

export type PlantNameFields = {
  nameEn: string;
  nameFa: string;
  scientificName?: string | null;
  category?: string;
  categoryFa?: string;
};

export type PlantTextFields = {
  description?: string | null;
  wateringGuide?: string | null;
  lightGuide?: string | null;
  fertilizerGuide?: string | null;
  soilGuide?: string | null;
  toxicity?: string | null;
  sunRequirement?: string | null;
  waterRequirement?: string | null;
  soilType?: string | null;
  soilPh?: string | null;
  difficulty?: string | null;
};

export type LocalizedCatalogPlant = PlantNameFields &
  PlantTextFields & {
    displayName: string;
    displayCategory: string;
    displayDescription: string | null;
    displayWateringGuide: string | null;
    displayLightGuide: string | null;
    displayFertilizerGuide: string | null;
    displaySoilGuide: string | null;
    displayToxicity: string | null;
    displaySunRequirement: string | null;
    displayWaterRequirement: string | null;
    displaySoilType: string | null;
    displayDifficulty: string | null;
  };

const PERSIAN_CHAR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

const SUN_FA: Record<string, string> = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
  "full sun": "آفتاب کامل",
  "partial shade": "نیمه‌سایه",
  "partial sun": "آفتاب جزئی",
  "bright indirect": "نور غیرمستقیم روشن",
  "bright indirect light": "نور غیرمستقیم روشن",
  shade: "سایه",
  "low light": "نور کم",
  "direct sun": "آفتاب مستقیم",
};

const WATER_FA: Record<string, string> = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
  moist: "مرطوب",
  dry: "خشک",
};

const DIFFICULTY_FA: Record<string, string> = {
  easy: "آسان",
  moderate: "متوسط",
  medium: "متوسط",
  difficult: "سخت",
  hard: "سخت",
  beginner: "مبتدی",
};

const EN_FA_PHRASES: [string, string][] = [
  [
    "Water when the top layer of soil feels dry. This plant typically needs",
    "وقتی لایهٔ بالایی خاک خشک شد آبیاری کنید. این گیاه معمولاً به آبیاری",
  ],
  ["watering — adjust for your climate and pot size.", "نیاز دارد — با توجه به آب‌وهوا و اندازهٔ گلدان تنظیم کنید."],
  ["Place in", "در"],
  ["light. Avoid harsh direct sun unless the species requires it.", "نور قرار دهید. از آفتاب مستقیم شدید پرهیز کنید مگر گونه به آن نیاز داشته باشد."],
  ["Ensure the pot has drainage holes.", "مطمئن شوید گلدان سوراخ زهکشی دارد."],
  ["Use", "از"],
  [". Ensure the pot has drainage holes.", " استفاده کنید. گلدان باید زهکشی داشته باشد."],
  ["During growing season", "در فصل رشد"],
  ["Overview", "معرفی"],
  ["Care guide", "راهنمای مراقبت"],
  ["well-draining potting mix", "خاک گلدانی با زهکشی خوب"],
  ["well draining potting mix", "خاک گلدانی با زهکشی خوب"],
  ["well-draining soil", "خاک با زهکشی خوب"],
  ["well draining soil", "خاک با زهکشی خوب"],
  ["potting mix", "خاک گلدان"],
  ["bright indirect light", "نور غیرمستقیم روشن"],
  ["bright indirect", "نور غیرمستقیم روشن"],
  ["partial shade", "نیمه‌سایه"],
  ["partial sun", "آفتاب جزئی"],
  ["full sun", "آفتاب کامل"],
  ["direct sun", "آفتاب مستقیم"],
  ["low light", "نور کم"],
  ["avoid overwatering", "از آبیاری بیش از حد پرهیز کنید"],
  ["Allow the soil to dry", "اجازه دهید خاک خشک شود"],
  ["keep the soil moist", "خاک را مرطوب نگه دارید"],
  ["keep soil evenly moist", "خاک را به‌طور یکنواخت مرطوب نگه دارید"],
  ["water regularly", "به‌طور منظم آبیاری کنید"],
  ["water sparingly", "کم آبیاری کنید"],
  ["once a week", "هفته‌ای یک‌بار"],
  ["every two weeks", "هر دو هفته"],
  ["every 1-2 weeks", "هر ۱ تا ۲ هفته"],
  ["in the growing season", "در فصل رشد"],
  ["in winter", "در زمستان"],
  ["fertilize monthly", "ماهانه کود دهید"],
  ["balanced fertilizer", "کود متعادل"],
  ["liquid fertilizer", "کود مایع"],
  ["diluted fertilizer", "کود رقیق‌شده"],
  ["toxic to pets", "سمی برای حیوانات خانگی"],
  ["toxic to cats", "سمی برای گربه"],
  ["toxic to dogs", "سمی برای سگ"],
  ["non-toxic", "غیرسمی"],
  ["pet-friendly", "مناسب حیوانات خانگی"],
  ["houseplant", "گیاه آپارتمانی"],
  ["indoor plant", "گیاه داخلی"],
  ["native to", "بومی"],
  ["originates from", "منشأ آن"],
  ["popular for", "محبوب به‌خاطر"],
  ["known for", "شناخته‌شده به‌خاطر"],
  ["easy to grow", "کشت آسان"],
  ["easy care", "مراقبت آسان"],
  ["low maintenance", "نگهداری آسان"],
  ["air purifying", "تصفیهٔ هوا"],
  ["trailing vines", "ساقه‌های آویز"],
  ["variegated leaves", "برگ‌های ابلق"],
  ["Distribution:", "پراکنش:"],
  ["Uses:", "کاربرد:"],
  ["Life form:", "فرم رویشی:"],
  ["Climate:", "اقلیم:"],
  ["medicinal", "دارویی"],
  ["culinary", "خوراکی"],
  ["ornamental", "زینتی"],
  ["aromatic", "معطر"],
  ["humidity", "رطوبت"],
  ["temperature", "دما"],
  ["pruning", "هرس"],
  ["propagation", "تکثیر"],
  ["by cuttings", "با قلمه"],
  ["by division", "با تقسیم بوته"],
  ["root rot", "پوسیدگی ریشه"],
  ["powdery mildew", "سفیدک پودری"],
  ["leaf spot", "لکه برگی"],
  ["spider mites", "کنه تار عنکبوتی"],
  ["mealybugs", "شپشک آردی"],
  ["aphids", "شته"],
];

const EN_FA_WORDS: [string, string][] = [
  ["watering", "آبیاری"],
  ["fertilizer", "کود"],
  ["fertilise", "کوددهی"],
  ["fertilize", "کوددهی"],
  ["drainage", "زهکشی"],
  ["indirect", "غیرمستقیم"],
  ["sunlight", "نور خورشید"],
  ["leaves", "برگ‌ها"],
  ["roots", "ریشه‌ها"],
  ["moist", "مرطوب"],
  ["weekly", "هفتگی"],
  ["monthly", "ماهانه"],
  ["indoor", "داخل خانه"],
  ["outdoor", "فضای باز"],
  ["tropical", "گرمسیری"],
  ["perennial", "چندساله"],
  ["species", "گونه"],
  ["flowers", "گل‌ها"],
  ["flower", "گل"],
  ["soil", "خاک"],
  ["light", "نور"],
  ["plant", "گیاه"],
  ["leaf", "برگ"],
  ["root", "ریشه"],
  ["shade", "سایه"],
  ["water", "آب"],
];

const FA_EN_PHRASES: [string, string][] = EN_FA_PHRASES.map(([en, fa]) => [fa, en]);

export { SUN_FA, WATER_FA, DIFFICULTY_FA };

function countPersianChars(text: string): number {
  return (text.match(new RegExp(PERSIAN_CHAR.source, "g")) || []).length;
}

export function isPrimarilyPersian(text: string): boolean {
  const letters = text.replace(/[\s\d.,;:!?\-—()'"]/g, "");
  if (!letters.length) return false;
  return countPersianChars(letters) / letters.length > 0.35;
}

export function isScientificBinomial(name: string): boolean {
  return /^[A-Z][a-z]+(?:\s+[a-z]+)+$/.test(name.trim());
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function hasCuratedPersianName(nameEn: string): boolean {
  if (PERSIAN_PLANT_NAMES[nameEn]) return true;
  return Object.keys(PERSIAN_PLANT_NAMES).some(
    (k) => k.toLowerCase() === nameEn.toLowerCase()
  );
}

function isLikelyTransliteratedScientific(
  nameFa: string,
  nameEn: string,
  scientificName?: string | null
): boolean {
  if (!nameFa || isPrimarilyPersian(nameFa) === false) return false;
  const latin = scientificName || nameEn;
  if (!latin || !isScientificBinomial(latin)) return false;
  if (nameEn === latin && nameFa !== nameEn) {
    return !hasCuratedPersianName(nameEn);
  }
  return nameFa.replace(/\s+/g, " ") === getPersianName(latin).replace(/\s+/g, " ");
}

export function localizePlantName(
  entry: PlantNameFields,
  locale: Locale
): string {
  const nameEn = entry.nameEn?.trim() || "";
  const nameFa = entry.nameFa?.trim() || "";
  const scientific = entry.scientificName?.trim() || "";
  const category = entry.category || "";

  if (locale === "en") {
    if (nameEn && !isScientificBinomial(nameEn)) return nameEn;
    if (nameEn) return nameEn;
    if (scientific) return scientific;
    return nameFa || nameEn;
  }

  const fromDictionary = getPersianName(
    nameEn,
    category,
    scientific || undefined
  );
  const hasCuratedFa =
    fromDictionary !== nameEn &&
    !fromDictionary.includes("(") &&
    !isScientificBinomial(fromDictionary);

  if (hasCuratedFa) return fromDictionary;

  if (
    nameFa &&
    nameFa !== nameEn &&
    !isLikelyTransliteratedScientific(nameFa, nameEn, scientific)
  ) {
    return nameFa;
  }

  return fromDictionary;
}

export function localizeCategory(
  category: string,
  categoryFa: string | undefined,
  locale: Locale
): string {
  if (locale === "fa") return categoryFa || getCategoryFa(category);
  return category;
}

export function localizeEnumValue(
  value: string | null | undefined,
  locale: Locale,
  map: Record<string, string>
): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (locale === "en") {
    if (isPrimarilyPersian(trimmed)) {
      const hit = FA_EN_PHRASES.find(([fa]) => trimmed.toLowerCase().includes(fa.toLowerCase()));
      if (hit) return hit[1];
    }
    return trimmed;
  }
  const key = normalizeKey(trimmed);
  if (map[key]) return map[key];
  for (const [en, fa] of Object.entries(map)) {
    if (key.includes(en)) return fa;
  }
  if (isPrimarilyPersian(trimmed)) return trimmed;
  return translateEnToFa(trimmed);
}

export function translateEnToFa(text: string): string {
  if (!text.trim() || isPrimarilyPersian(text)) return text;
  let out = text;
  const phrases = [...EN_FA_PHRASES].sort((a, b) => b[0].length - a[0].length);
  for (const [en, fa] of phrases) {
    out = out.replace(new RegExp(escapeRegExp(en), "gi"), fa);
  }
  for (const [en, fa] of EN_FA_WORDS) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(en)}\\b`, "gi"), fa);
  }
  return out;
}

export function translateFaToEn(text: string): string {
  if (!text.trim() || !isPrimarilyPersian(text)) return text;
  let out = text;
  for (const [fa, en] of FA_EN_PHRASES) {
    out = out.replace(new RegExp(escapeRegExp(fa), "g"), en);
  }
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Structured FA blurb when free-form English text cannot be phrase-translated well. */
export function buildFaCareBlurb(fields: {
  displayName?: string;
  waterRequirement?: string | null;
  sunRequirement?: string | null;
  difficulty?: string | null;
  category?: string;
}): string {
  const water =
    localizeEnumValue(fields.waterRequirement, "fa", WATER_FA) || "متوسط";
  const light =
    localizeEnumValue(fields.sunRequirement, "fa", SUN_FA) || "غیرمستقیم";
  const difficulty =
    localizeEnumValue(fields.difficulty, "fa", DIFFICULTY_FA) || "متوسط";
  const name = fields.displayName || "این گیاه";
  const category = fields.category
    ? localizeCategory(fields.category, undefined, "fa")
    : "گیاه زینتی";

  return `${name} (${category}) معمولاً به آبیاری ${water} و نور ${light} نیاز دارد. سطح مراقبت: ${difficulty}. برای جزئیات بیشتر از راهنمای مراقبت همین صفحه استفاده کنید.`;
}

export function localizePlantText(
  text: string | null | undefined,
  locale: Locale,
  fallbackFa?: string | null
): string | null {
  if (!text?.trim()) return null;
  const trimmed = text.trim();
  if (locale === "fa") {
    if (isPrimarilyPersian(trimmed)) return trimmed;
    const translated = translateEnToFa(trimmed);
    if (isPrimarilyPersian(translated)) return translated;
    // Long English catalog prose → prefer structured FA blurb over raw English
    if (fallbackFa?.trim() && trimmed.length > 80) return fallbackFa.trim();
    if (fallbackFa?.trim() && countPersianChars(translated) < 8) {
      return fallbackFa.trim();
    }
    return translated;
  }
  return isPrimarilyPersian(trimmed) ? translateFaToEn(trimmed) : trimmed;
}

export function localizeCatalogPlant<T extends PlantNameFields & PlantTextFields>(
  plant: T,
  locale: Locale
): T & LocalizedCatalogPlant {
  const displayName = localizePlantName(plant, locale);
  const displayCategory = localizeCategory(
    plant.category || "",
    plant.categoryFa,
    locale
  );
  const faBlurb =
    locale === "fa"
      ? buildFaCareBlurb({
          displayName,
          waterRequirement: plant.waterRequirement,
          sunRequirement: plant.sunRequirement,
          difficulty: plant.difficulty,
          category: plant.category,
        })
      : null;

  return {
    ...plant,
    displayName,
    displayCategory,
    displayDescription: localizePlantText(plant.description, locale, faBlurb),
    displayWateringGuide: localizePlantText(plant.wateringGuide, locale),
    displayLightGuide: localizePlantText(plant.lightGuide, locale),
    displayFertilizerGuide: localizePlantText(plant.fertilizerGuide, locale),
    displaySoilGuide: localizePlantText(plant.soilGuide, locale),
    displayToxicity: localizePlantText(plant.toxicity, locale),
    displaySunRequirement: localizeEnumValue(
      plant.sunRequirement,
      locale,
      SUN_FA
    ),
    displayWaterRequirement: localizeEnumValue(
      plant.waterRequirement,
      locale,
      WATER_FA
    ),
    displaySoilType: localizePlantText(plant.soilType, locale),
    displayDifficulty: localizeEnumValue(
      plant.difficulty,
      locale,
      DIFFICULTY_FA
    ),
  };
}

export function getLocaleFromRequest(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
  nextUrl?: { searchParams: URLSearchParams };
}): Locale {
  const fromQuery = request.nextUrl?.searchParams.get("locale");
  if (fromQuery === "fa" || fromQuery === "en") return fromQuery;
  const cookie = request.cookies.get("plantcare-locale")?.value;
  if (cookie === "fa" || cookie === "en") return cookie;
  return "fa";
}

export function resolveBilingualNames(
  nameEn: string,
  nameFa: string,
  scientificName?: string | null,
  category?: string
): { nameEn: string; nameFa: string } {
  const sci = scientificName?.trim() || "";
  const en = nameEn.trim() || sci;
  const fa = localizePlantName(
    {
      nameEn: en,
      nameFa: nameFa.trim(),
      scientificName: sci || null,
      category,
      categoryFa: category ? getCategoryFa(category) : undefined,
    },
    "fa"
  );

  return { nameEn: en, nameFa: fa };
}

function localizeStringArray(
  items: string[],
  locale: Locale
): string[] {
  return items.map((item) => localizePlantText(item, locale) || item);
}

/** Re-localize a stored or AI analysis snapshot for the active UI locale. */
export function localizeAnalysisResult(
  analysis: PlantAnalysis,
  locale: Locale
): PlantAnalysis {
  if (locale === "en") return analysis;

  const plantFields = {
    nameEn: analysis.plant.commonNameEn || analysis.plant.commonName,
    nameFa: analysis.plant.commonNameFa || "",
    scientificName: analysis.plant.scientificName,
    category: analysis.plant.category,
  };

  return {
    plant: {
      ...analysis.plant,
      commonName: localizePlantName(plantFields, locale),
      description:
        localizePlantText(
          analysis.plant.description,
          locale,
          buildFaCareBlurb({
            displayName: localizePlantName(plantFields, locale),
            category: analysis.plant.category,
          })
        ) || analysis.plant.description,
      category: localizeCategory(
        analysis.plant.category || "",
        undefined,
        locale
      ),
      uses: localizePlantText(analysis.plant.uses, locale) || analysis.plant.uses,
      family:
        formatBotanicalFamily(analysis.plant.family, locale) ||
        analysis.plant.family,
    },
    health: {
      ...analysis.health,
      possibleProblems: localizeStringArray(
        analysis.health.possibleProblems,
        locale
      ),
      diseaseDiagnosis: localizeStringArray(
        analysis.health.diseaseDiagnosis,
        locale
      ),
      pestDiagnosis: localizeStringArray(analysis.health.pestDiagnosis, locale),
      soilAnalysis:
        localizePlantText(analysis.health.soilAnalysis, locale) ||
        analysis.health.soilAnalysis,
    },
    care: {
      watering: localizePlantText(analysis.care.watering, locale) || analysis.care.watering,
      light: localizePlantText(analysis.care.light, locale) || analysis.care.light,
      soil: localizePlantText(analysis.care.soil, locale) || analysis.care.soil,
      fertilizer:
        localizePlantText(analysis.care.fertilizer, locale) ||
        analysis.care.fertilizer,
      temperature:
        localizePlantText(analysis.care.temperature, locale) ||
        analysis.care.temperature,
      humidity:
        localizePlantText(analysis.care.humidity, locale) || analysis.care.humidity,
    },
    treatment: {
      immediateActions: localizeStringArray(
        analysis.treatment.immediateActions,
        locale
      ),
      stepByStepPlan: localizeStringArray(
        analysis.treatment.stepByStepPlan,
        locale
      ),
      prevention: localizeStringArray(analysis.treatment.prevention, locale),
      warnings: localizeStringArray(analysis.treatment.warnings, locale),
    },
    meta: analysis.meta,
  };
}
