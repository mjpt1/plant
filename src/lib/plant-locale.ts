import type { Locale } from "@/i18n";
import {
  CATEGORY_FA,
  PERSIAN_PLANT_NAMES,
  getCategoryFa,
  getPersianName,
} from "@/data/plantNames";

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
  ["well-draining soil", "خاک با زهکشی خوب"],
  ["bright indirect light", "نور غیرمستقیم روشن"],
  ["bright indirect", "نور غیرمستقیم روشن"],
  ["partial shade", "نیمه‌سایه"],
  ["full sun", "آفتاب کامل"],
  ["low light", "نور کم"],
  ["avoid overwatering", "از آبیاری بیش از حد پرهیز کنید"],
  ["toxic to pets", "سمی برای حیوانات خانگی"],
  ["toxic to cats", "سمی برای گربه"],
  ["toxic to dogs", "سمی برای سگ"],
  ["non-toxic", "غیرسمی"],
  ["Distribution:", "پراکنش:"],
  ["Uses:", "کاربرد:"],
  ["Life form:", "فرم رویشی:"],
  ["Climate:", "اقلیم:"],
  ["medicinal", "دارویی"],
  ["culinary", "خوراکی"],
  ["ornamental", "زینتی"],
  ["aromatic", "معطر"],
  ["low", "کم"],
  ["medium", "متوسط"],
  ["high", "زیاد"],
  ["easy", "آسان"],
  ["moderate", "متوسط"],
  ["difficult", "سخت"],
];

const FA_EN_PHRASES: [string, string][] = EN_FA_PHRASES.map(([en, fa]) => [fa, en]);

function countPersianChars(text: string): number {
  return (text.match(new RegExp(PERSIAN_CHAR.source, "g")) || []).length;
}

export function isPrimarilyPersian(text: string): boolean {
  const letters = text.replace(/[\s\d.,;:!?\-—()]/g, "");
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
  const categoryFa = entry.categoryFa || getCategoryFa(category);

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
  for (const [en, fa] of EN_FA_PHRASES) {
    out = out.replace(new RegExp(escapeRegExp(en), "gi"), fa);
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

export function localizePlantText(
  text: string | null | undefined,
  locale: Locale
): string | null {
  if (!text?.trim()) return null;
  const trimmed = text.trim();
  if (locale === "fa") {
    return isPrimarilyPersian(trimmed) ? trimmed : translateEnToFa(trimmed);
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

  return {
    ...plant,
    displayName,
    displayCategory,
    displayDescription: localizePlantText(plant.description, locale),
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
  return "en";
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
