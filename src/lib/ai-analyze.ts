import { plantAnalysisSchema, type PlantAnalysis, sanitizeDiseaseLabels, reconcileHealthStatus } from "@/types/analysis";
import { z } from "zod";
import { formatBotanicalFamily } from "@/lib/botanical-family";
import {
  findCatalogByScientificName,
  type CatalogMatch,
} from "@/lib/catalog-lookup";
import {
  getPlantNetApiKey,
  identifyWithPlantNet,
} from "@/lib/plantnet-identify";
import {
  localizeCategory,
  localizePlantName,
  localizePlantText,
  localizeEnumValue,
} from "@/lib/plant-locale";
import {
  getHeuristicHealthAssessment,
  needsVisualHealthAssessment,
} from "@/lib/plant-health-heuristics";
import {
  isDiseaseModelConfigured,
  predictDiseaseFromImage,
} from "@/lib/ml/disease-model";
import type { Locale } from "@/i18n";

function withMeta(
  analysis: PlantAnalysis,
  meta: Partial<NonNullable<PlantAnalysis["meta"]>> &
    Pick<
      NonNullable<PlantAnalysis["meta"]>,
      "speciesSource" | "healthSource" | "diseaseModelUsed" | "diseaseModelLabels"
    >
): PlantAnalysis {
  const diseaseDiagnosis = sanitizeDiseaseLabels(analysis.health.diseaseDiagnosis);
  const health = {
    ...analysis.health,
    diseaseDiagnosis,
    status: reconcileHealthStatus({
      ...analysis.health,
      diseaseDiagnosis,
    }),
  };
  return {
    ...analysis,
    meta: {
      speciesSource: meta.speciesSource ?? "none",
      healthSource: meta.healthSource ?? "none",
      diseaseModelUsed: meta.diseaseModelUsed ?? false,
      diseaseModelLabels: meta.diseaseModelLabels ?? [],
      speciesCandidates:
        meta.speciesCandidates ?? analysis.meta?.speciesCandidates ?? [],
      visionConfigured:
        meta.visionConfigured ??
        analysis.meta?.visionConfigured ??
        hasLlmAnalysisConfigured(),
      toxicityWarning:
        meta.toxicityWarning ?? analysis.meta?.toxicityWarning ?? "",
    },
    health,
  };
}

function getPrimaryAnalysisKey(): string | undefined {
  return process.env.ANALYSIS_PRIMARY_KEY || process.env.OPENAI_API_KEY;
}

function getFallbackAnalysisKey(): string | undefined {
  return process.env.ANALYSIS_FALLBACK_KEY || process.env.GEMINI_API_KEY;
}

function getGeminiModelCandidates(): string[] {
  const preferred =
    process.env.GEMINI_MODEL ||
    process.env.ANALYSIS_GEMINI_MODEL ||
    "gemini-2.0-flash";
  const fallbacks = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
  return Array.from(new Set([preferred, ...fallbacks]));
}

function hasLlmAnalysisConfigured(): boolean {
  return !!(getPrimaryAnalysisKey() || getFallbackAnalysisKey());
}

export function hasAnalysisConfigured(): boolean {
  return hasLlmAnalysisConfigured() || !!getPlantNetApiKey();
}

export function isDemoAnalysisMode(): boolean {
  return !hasAnalysisConfigured();
}

/** @deprecated Use isDemoAnalysisMode */
export function isDemoAiMode(): boolean {
  return isDemoAnalysisMode();
}

function getUnconfiguredAnalysis(locale?: string): PlantAnalysis {
  const fa = locale === "fa";
  return withMeta(
    {
      plant: {
        commonName: fa ? "شناسایی غیرفعال" : "Identification unavailable",
        commonNameEn: "Identification unavailable",
        commonNameFa: "شناسایی غیرفعال",
        scientificName: "",
        family: "",
        confidence: 0,
        description: "",
        category: "",
        uses: "",
      },
      health: {
        status: "unknown",
        possibleProblems: [],
        diseaseDiagnosis: [],
        pestDiagnosis: [],
        soilAnalysis: fa
          ? "برای تحلیل تصویر، کلید PlantNet یا سرویس تحلیل را در تنظیمات سرور وارد کنید."
          : "Configure PlantNet or an analysis API key on the server to analyze images.",
        confidence: 0,
      },
      care: {
        watering: "—",
        light: "—",
        soil: "—",
        fertilizer: "—",
        temperature: "—",
        humidity: "—",
      },
      treatment: {
        immediateActions: [],
        stepByStepPlan: [],
        prevention: [],
        warnings: [
          fa
            ? "سرویس شناسایی گیاه پیکربندی نشده است."
            : "Plant identification service is not configured.",
        ],
      },
    },
    { speciesSource: "none", healthSource: "none", diseaseModelUsed: false, diseaseModelLabels: [] }
  );
}

function buildPlantDescription(
  catalog: CatalogMatch | null,
  identification: { family: string | null },
  locale?: string
): string {
  const lang = (locale || "en") as Locale;
  const fa = lang === "fa";
  const parts: string[] = [];

  if (catalog?.description) {
    parts.push(localizePlantText(catalog.description, lang) || catalog.description);
  }

  if (catalog?.lifeform) {
    parts.push(
      fa
        ? `فرم رویشی: ${localizePlantText(catalog.lifeform, lang) || catalog.lifeform}`
        : `Life form: ${catalog.lifeform}`
    );
  }

  if (catalog?.climate) {
    parts.push(
      fa
        ? `اقلیم: ${localizePlantText(catalog.climate, lang) || catalog.climate}`
        : `Climate: ${catalog.climate}`
    );
  }

  if (catalog?.geographicArea && !catalog.description?.includes("پراکنش")) {
    parts.push(
      fa
        ? `پراکنش: ${catalog.geographicArea}`
        : `Distribution: ${catalog.geographicArea}`
    );
  }

  if (parts.length > 0) return parts.join("\n");

  const family =
    formatBotanicalFamily(catalog?.family || identification.family, locale) ||
    (fa ? "نامشخص" : "unknown");
  return fa
    ? `این گیاه از تیرهٔ ${family} است. جزئیات بیشتر در کتابخانهٔ گیاه‌یار موجود است.`
    : `This plant belongs to the ${family} family. More details are available in the GiahYar library.`;
}

function buildPlantUses(
  catalog: CatalogMatch | null,
  locale?: string
): string {
  const lang = (locale || "en") as Locale;
  const fa = lang === "fa";

  if (catalog?.uses) {
    return localizePlantText(catalog.uses, lang) || catalog.uses;
  }

  const category = catalog?.category;
  if (!category) return "";

  const useByCategory: Record<string, { fa: string; en: string }> = {
    houseplant: {
      fa: "گیاه آپارتمانی و زینتی برای فضای داخلی",
      en: "Indoor ornamental houseplant",
    },
    succulent: {
      fa: "گیاه گوشتی زینتی؛ نگهداری آسان",
      en: "Ornamental succulent; easy care",
    },
    herb: {
      fa: "دارویی / خوراکی و معطر",
      en: "Medicinal, culinary, or aromatic herb",
    },
    flower: {
      fa: "گل زینتی",
      en: "Ornamental flowering plant",
    },
    vegetable: {
      fa: "سبزی خوراکی",
      en: "Edible vegetable",
    },
    "root-vegetable": {
      fa: "سبزی ریشه‌ای خوراکی",
      en: "Edible root vegetable",
    },
    "fruit-tree": {
      fa: "درخت میوه خوراکی",
      en: "Edible fruit tree",
    },
    "nut-tree": {
      fa: "درخت مغزدار خوراکی",
      en: "Edible nut tree",
    },
    vine: {
      fa: "گیاه بالارونده زینتی",
      en: "Ornamental climbing vine",
    },
    rose: {
      fa: "گل زینتی و معطر",
      en: "Ornamental and fragrant rose",
    },
  };

  const mapped = useByCategory[category];
  if (mapped) return fa ? mapped.fa : mapped.en;

  return localizeCategory(category, catalog?.categoryFa, lang);
}

function buildAnalysisFromCatalog(
  catalog: CatalogMatch | null,
  identification: {
    scientificName: string;
    scientificNameWithAuthor: string;
    family: string | null;
    commonNameEn: string | null;
    score: number;
    candidates?: Array<{
      scientificName: string;
      scientificNameWithAuthor: string;
      family: string | null;
      commonNameEn: string | null;
      score: number;
    }>;
  },
  locale?: string,
  imageType?: string
): PlantAnalysis {
  const lang = (locale || "en") as Locale;
  const fa = lang === "fa";
  const confidence = Math.round(Math.min(identification.score, 1) * 100);

  const nameFields = {
    nameEn:
      catalog?.nameEn ||
      identification.commonNameEn ||
      identification.scientificName,
    nameFa: catalog?.nameFa || "",
    scientificName:
      catalog?.scientificName || identification.scientificName || null,
    category: catalog?.category,
    categoryFa: catalog?.categoryFa,
  };
  const commonNameEn = localizePlantName(nameFields, "en");
  const commonNameFa = localizePlantName(nameFields, "fa");
  const commonName = fa ? commonNameFa : commonNameEn;

  const botanicalFamily = formatBotanicalFamily(
    identification.family || catalog?.family || null,
    locale
  ) || (fa ? "نامشخص" : "Unknown");

  const careFallback = fa
    ? "اطلاعات مراقبت از کتابخانه گیاهان گیاه‌یار"
    : "Care data from the GiahYar plant library";

  const watering =
    localizePlantText(catalog?.wateringGuide, lang) ||
    localizeEnumValue(catalog?.waterRequirement, lang, {
      low: "کم",
      medium: "متوسط",
      high: "زیاد",
    }) ||
    careFallback;
  const light =
    localizePlantText(catalog?.lightGuide, lang) ||
    localizeEnumValue(catalog?.sunRequirement, lang, {
      low: "کم",
      medium: "متوسط",
      high: "زیاد",
      "full sun": "آفتاب کامل",
      "partial shade": "نیمه‌سایه",
      "bright indirect": "نور غیرمستقیم روشن",
    }) ||
    careFallback;
  const soil =
    localizePlantText(catalog?.soilGuide, lang) ||
    localizePlantText(catalog?.soilType, lang) ||
    careFallback;
  const fertilizer =
    localizePlantText(catalog?.fertilizerGuide, lang) ||
    (fa ? "طبق فصل رشد" : "During growing season");

  const toxicityRaw = catalog?.toxicity?.trim() || "";
  const toxicityLocalized =
    localizePlantText(toxicityRaw, lang) || toxicityRaw;
  const looksToxic =
    /toxic|سمی|poison|خطر|pet|گربه|سگ|child|کودک/i.test(toxicityRaw);
  const toxicityWarning = looksToxic
    ? fa
      ? `هشدار سمیت: ${toxicityLocalized}`
      : `Toxicity warning: ${toxicityLocalized}`
    : "";

  const speciesCandidates = (identification.candidates || []).map((c) => ({
    scientificName: c.scientificNameWithAuthor || c.scientificName,
    commonName: c.commonNameEn || "",
    family: c.family || "",
    confidence: Math.round(Math.min(c.score, 1) * 100),
  }));

  return withMeta(
    {
      plant: {
        commonName,
        commonNameEn,
        commonNameFa,
        scientificName:
          catalog?.scientificName ||
          identification.scientificNameWithAuthor ||
          identification.scientificName,
        family: botanicalFamily,
        confidence,
        description: buildPlantDescription(catalog, identification, locale),
        category: localizeCategory(
          catalog?.category || "",
          catalog?.categoryFa,
          lang
        ),
        uses: buildPlantUses(catalog, locale),
      },
      health: {
        status: "unknown",
        possibleProblems: [],
        diseaseDiagnosis:
          imageType === "pest"
            ? [
                fa
                  ? "برای تشخیص دقیق آفت، تصویر نزدیک‌تر از برگ یا ساقه بگیرید."
                  : "Take a closer photo of leaves or stems for pest diagnosis.",
              ]
            : [],
        pestDiagnosis: [],
        soilAnalysis:
          imageType === "soil"
            ? fa
              ? "تحلیل خاک از روی تصویر محدود است؛ نمونه خاک را هم بررسی کنید."
              : "Soil analysis from photos is limited; inspect a soil sample too."
            : fa
              ? "وضعیت سلامت از تصویر به‌طور کامل مشخص نیست. برای تشخیص بیماری عکس نزدیک از برگ بگیرید."
              : "Health status cannot be fully assessed from this photo. Take a closer leaf photo for disease checks.",
        confidence: Math.max(20, Math.round(confidence * 0.5)),
      },
      care: {
        watering,
        light,
        soil,
        fertilizer,
        temperature: fa ? "۱۸ تا ۲۷ درجه سانتی‌گراد" : "18–27°C typical for houseplants",
        humidity: fa ? "بسته به گونه متفاوت است" : "Varies by species",
      },
      treatment: {
        immediateActions: [
          fa
            ? "برگ‌های آسیب‌دیده را جدا کنید و بهداشت ابزار را رعایت کنید."
            : "Remove damaged leaves and sanitize pruning tools.",
        ],
        stepByStepPlan: [
          fa
            ? "گیاه را در کتابخانه گیاه‌یار جستجو کنید."
            : "Search this plant in the GiahYar library.",
          fa
            ? "برنامه مراقبت را به تقویم اضافه کنید."
            : "Add a care schedule to your calendar.",
          fa
            ? "برای تشخیص بیماری، عکس نزدیک از ناحیهٔ آسیب‌دیده بگیرید."
            : "For disease checks, take a close-up of affected tissue.",
        ],
        prevention: toxicityLocalized
          ? [toxicityLocalized]
          : [fa ? "از آب‌دهی بیش از حد پرهیز کنید." : "Avoid overwatering."],
        warnings: toxicityWarning ? [toxicityWarning] : [],
      },
    },
    {
      speciesSource: "plantnet",
      healthSource: "none",
      diseaseModelUsed: false,
      diseaseModelLabels: [],
      speciesCandidates,
      visionConfigured: hasLlmAnalysisConfigured(),
      toxicityWarning,
    }
  );
}

const ANALYSIS_PROMPT = `You are an expert botanist and plant pathologist. Analyze this plant-related image and return ONLY valid JSON (no markdown) with this exact structure:

{
  "plant": {
    "commonName": "",
    "scientificName": "",
    "family": "",
    "confidence": 0,
    "description": "2-4 sentences about what the plant is, origin/traits, and why people grow it",
    "category": "e.g. houseplant, herb, flower",
    "uses": "practical uses: ornamental, medicinal, culinary, etc."
  },
  "health": {
    "status": "healthy | warning | critical | unknown",
    "possibleProblems": [],
    "diseaseDiagnosis": [],
    "pestDiagnosis": [],
    "soilAnalysis": "",
    "confidence": 0
  },
  "care": {
    "watering": "",
    "light": "",
    "soil": "",
    "fertilizer": "",
    "temperature": "",
    "humidity": ""
  },
  "treatment": {
    "immediateActions": [],
    "stepByStepPlan": [],
    "prevention": [],
    "warnings": []
  }
}

Your analysis MUST cover plant identification (including botanical family, description, and uses), disease signs, soil condition, pest signs, treatment plan, and confidence scores (0-100). Be specific and practical for home gardeners.

Critical disease rules:
- diseaseDiagnosis: ONLY named pathology visible in the image (fungal spots, root rot, mosaic, bacterial ooze, rust, powdery mildew, etc.)
- NEVER put watering advice in diseaseDiagnosis (no underwatering/overwatering/کم آبی/آبیاری کم unless crisp dry soil + severe wilt are unmistakable)
- Put watering/light/nutrient suspects in possibleProblems only
- If unsure, status="unknown" with empty diseaseDiagnosis — do not invent diseases
- If healthy, status="healthy" and empty diagnosis arrays`;

const HEALTH_ANALYSIS_PROMPT = `You are an expert plant pathologist. Analyze THIS image for visible disease, pest damage, nutrient deficiency, and environmental stress.

Return ONLY valid JSON (no markdown):
{
  "health": {
    "status": "healthy | warning | critical | unknown",
    "possibleProblems": [],
    "diseaseDiagnosis": [],
    "pestDiagnosis": [],
    "soilAnalysis": "",
    "confidence": 0
  },
  "treatment": {
    "immediateActions": [],
    "stepByStepPlan": [],
    "prevention": [],
    "warnings": []
  }
}

Critical rules:
- diseaseDiagnosis: ONLY specific pathology you can see (fungal spots, rot, mosaic virus, bacterial ooze, etc.)
- NEVER put generic watering advice in diseaseDiagnosis (no "underwatering", "overwatering", "کم آبی", "آبیاری کم", "کمبود آب" unless crisp dry soil + wilt are clearly visible)
- possibleProblems may include watering/light/nutrient suspects as hypotheses, not confirmed diseases
- If the plant looks healthy, status="healthy" and leave diagnosis arrays empty
- Be conservative: when unsure, use status="unknown" rather than guessing`;

function buildHealthPrompt(
  imageType?: string,
  locale?: string,
  plantContext?: {
    commonName: string;
    scientificName: string;
    family: string;
    category: string;
  }
) {
  const typeHint = imageType
    ? `Photo focus: ${imageType.replace("_", " ")}.`
    : "";
  const langHint =
    locale === "fa"
      ? "Write all text values in Persian (Farsi)."
      : "Write all text values in English.";
  const plantHint = plantContext?.scientificName
    ? `Known plant: ${plantContext.commonName} (${plantContext.scientificName}), family ${plantContext.family}, category ${plantContext.category}.`
    : "";
  return `${HEALTH_ANALYSIS_PROMPT}\n${typeHint}\n${plantHint}\n${langHint}`;
}

const healthOnlySchema = z.object({
  health: plantAnalysisSchema.shape.health,
  treatment: plantAnalysisSchema.shape.treatment,
});

function extractHealthJson(content: string): z.infer<typeof healthOnlySchema> {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid JSON response from health analysis");
  }
  const parsed = JSON.parse(jsonMatch[0]);
  const result = healthOnlySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Health analysis response did not match expected schema");
  }
  return result.data;
}

function mergeHealthAnalysis(
  base: PlantAnalysis,
  healthResult: z.infer<typeof healthOnlySchema>,
  healthSource: NonNullable<PlantAnalysis["meta"]>["healthSource"] = "vision"
): PlantAnalysis {
  const diseaseDiagnosis = sanitizeDiseaseLabels(
    healthResult.health.diseaseDiagnosis
  );
  return withMeta(
    {
      ...base,
      health: {
        ...healthResult.health,
        diseaseDiagnosis,
      },
      treatment: {
        immediateActions:
          healthResult.treatment.immediateActions.length > 0
            ? healthResult.treatment.immediateActions
            : base.treatment.immediateActions,
        stepByStepPlan:
          healthResult.treatment.stepByStepPlan.length > 0
            ? healthResult.treatment.stepByStepPlan
            : base.treatment.stepByStepPlan,
        prevention:
          healthResult.treatment.prevention.length > 0
            ? healthResult.treatment.prevention
            : base.treatment.prevention,
        warnings: healthResult.treatment.warnings,
      },
    },
    {
      speciesSource: base.meta?.speciesSource || "plantnet",
      healthSource,
      diseaseModelUsed: base.meta?.diseaseModelUsed || false,
      diseaseModelLabels: base.meta?.diseaseModelLabels || [],
    }
  );
}

function applyHeuristicHealth(
  base: PlantAnalysis,
  imageType: string | undefined,
  locale?: string
): PlantAnalysis {
  const heuristic = getHeuristicHealthAssessment(
    imageType as import("@/types/analysis").ImageScanType,
    base.plant.category,
    (locale || "fa") as Locale
  );
  if (!heuristic) {
    return withMeta(base, {
      speciesSource: base.meta?.speciesSource || "plantnet",
      healthSource: "none",
      diseaseModelUsed: base.meta?.diseaseModelUsed || false,
      diseaseModelLabels: base.meta?.diseaseModelLabels || [],
    });
  }

  return withMeta(
    {
      ...base,
      health: {
        status: heuristic.status,
        possibleProblems: heuristic.possibleProblems,
        diseaseDiagnosis: sanitizeDiseaseLabels(heuristic.diseaseDiagnosis),
        pestDiagnosis: heuristic.pestDiagnosis,
        soilAnalysis: heuristic.soilAnalysis,
        confidence: heuristic.confidence,
      },
    },
    {
      speciesSource: base.meta?.speciesSource || "plantnet",
      healthSource: "heuristic",
      diseaseModelUsed: base.meta?.diseaseModelUsed || false,
      diseaseModelLabels: base.meta?.diseaseModelLabels || [],
    }
  );
}

async function analyzeHealthWithOpenAI(
  base64Image: string,
  mimeType: string,
  imageType?: string,
  locale?: string,
  plantContext?: {
    commonName: string;
    scientificName: string;
    family: string;
    category: string;
  }
): Promise<z.infer<typeof healthOnlySchema>> {
  const apiKey = getPrimaryAnalysisKey();
  if (!apiKey) throw new Error("Primary analysis key is not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildHealthPrompt(imageType, locale, plantContext),
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 2048,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Health analysis error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No health analysis response");
  return extractHealthJson(content);
}

async function analyzeHealthWithGemini(
  base64Image: string,
  mimeType: string,
  imageType?: string,
  locale?: string,
  plantContext?: {
    commonName: string;
    scientificName: string;
    family: string;
    category: string;
  }
): Promise<z.infer<typeof healthOnlySchema>> {
  const apiKey = getFallbackAnalysisKey();
  if (!apiKey) throw new Error("Fallback analysis key is not configured");

  let lastError: Error | null = null;
  for (const model of getGeminiModelCandidates()) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: buildHealthPrompt(imageType, locale, plantContext) },
                  { inline_data: { mime_type: mimeType, data: base64Image } },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        lastError = new Error(`Health analysis error: ${response.status} (${model})`);
        continue;
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        lastError = new Error(`No health analysis response (${model})`);
        continue;
      }
      return extractHealthJson(content);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Health analysis failed");
}

async function enrichWithHealthAnalysis(
  base: PlantAnalysis,
  base64Image: string,
  mimeType: string,
  imageType?: string,
  locale?: string
): Promise<PlantAnalysis> {
  // Always attempt disease CNN when configured (phase 2 stub).
  let working = base;
  if (isDiseaseModelConfigured()) {
    const disease = await predictDiseaseFromImage(base64Image, mimeType, {
      scientificName: base.plant.scientificName,
      imageType,
    });
    if (disease.used) {
      const fa = locale === "fa";
      const labels = disease.labels.map((l) => l.label);
      working = withMeta(
        {
          ...base,
          health: {
            ...base.health,
            status: "warning",
            diseaseDiagnosis: sanitizeDiseaseLabels(labels),
            confidence: Math.round(
              Math.max(...disease.labels.map((l) => l.score)) * 100
            ),
            soilAnalysis: fa
              ? "تشخیص اولیه از مدل بیماری اختصاصی؛ جزئیات را با عکس نزدیک تأیید کنید."
              : "Initial disease model prediction; confirm with a closer photo.",
          },
        },
        {
          speciesSource: base.meta?.speciesSource || "plantnet",
          healthSource: "disease_model",
          diseaseModelUsed: true,
          diseaseModelLabels: disease.labels,
        }
      );
    }
  }

  const shouldAssess =
    needsVisualHealthAssessment(imageType) ||
    working.meta?.healthSource === "disease_model" ||
    working.meta?.speciesSource === "plantnet" ||
    working.meta?.healthSource === "none" ||
    working.health.confidence < 55;

  if (!hasLlmAnalysisConfigured()) {
    if (shouldAssess && working.meta?.healthSource !== "disease_model") {
      return applyHeuristicHealth(working, imageType, locale);
    }
    return working;
  }

  if (!shouldAssess && working.meta?.healthSource === "disease_model") {
    // Still ask vision LLM to explain/treat when we have model labels.
  } else if (!shouldAssess) {
    return working;
  }

  const plantContext = {
    commonName: working.plant.commonName,
    scientificName: working.plant.scientificName,
    family: working.plant.family,
    category: working.plant.category || "",
  };

  try {
    let healthResult: z.infer<typeof healthOnlySchema>;
    if (getPrimaryAnalysisKey()) {
      try {
        healthResult = await analyzeHealthWithOpenAI(
          base64Image,
          mimeType,
          imageType,
          locale,
          plantContext
        );
      } catch {
        healthResult = await analyzeHealthWithGemini(
          base64Image,
          mimeType,
          imageType,
          locale,
          plantContext
        );
      }
    } else {
      healthResult = await analyzeHealthWithGemini(
        base64Image,
        mimeType,
        imageType,
        locale,
        plantContext
      );
    }

    // Prefer disease-model labels when present; let LLM fill treatment/explanation.
    if (working.meta?.diseaseModelUsed && working.health.diseaseDiagnosis.length > 0) {
      healthResult = {
        ...healthResult,
        health: {
          ...healthResult.health,
          diseaseDiagnosis: working.health.diseaseDiagnosis,
          confidence: Math.max(
            healthResult.health.confidence,
            working.health.confidence
          ),
        },
      };
      const merged = mergeHealthAnalysis(working, healthResult, "disease_model");
      return withMeta(merged, {
        speciesSource: working.meta?.speciesSource || "plantnet",
        healthSource: "disease_model",
        diseaseModelUsed: true,
        diseaseModelLabels: working.meta?.diseaseModelLabels || [],
      });
    }

    return mergeHealthAnalysis(working, healthResult, "vision");
  } catch {
    if (working.meta?.healthSource === "disease_model") return working;
    if (needsVisualHealthAssessment(imageType)) {
      return applyHeuristicHealth(working, imageType, locale);
    }
    return working;
  }
}

function buildPrompt(imageType?: string, locale?: string) {
  const typeHint = imageType
    ? `The user photographed: ${imageType.replace("_", " ")}.`
    : "";
  const langHint =
    locale === "fa"
      ? "Write all text values in Persian (Farsi). Keep scientificName in Latin."
      : "Write all text values in English.";
  return `${ANALYSIS_PROMPT}\n${typeHint}\n${langHint}`;
}

function extractJson(content: string): PlantAnalysis {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid JSON response from analysis service");
  }
  const parsed = JSON.parse(jsonMatch[0]);
  const result = plantAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Analysis response did not match expected schema");
  }
  return result.data;
}

async function analyzeWithOpenAI(
  base64Image: string,
  mimeType: string,
  imageType?: string,
  locale?: string
): Promise<PlantAnalysis> {
  const apiKey = getPrimaryAnalysisKey();
  if (!apiKey) throw new Error("Primary analysis key is not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildPrompt(imageType, locale) },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    await response.text();
    throw new Error(`Primary analysis service error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response from primary analysis service");
  return extractJson(content);
}

async function analyzeWithGemini(
  base64Image: string,
  mimeType: string,
  imageType?: string,
  locale?: string
): Promise<PlantAnalysis> {
  const apiKey = getFallbackAnalysisKey();
  if (!apiKey) throw new Error("Fallback analysis key is not configured");

  let lastError: Error | null = null;
  for (const model of getGeminiModelCandidates()) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: buildPrompt(imageType, locale) },
                  { inline_data: { mime_type: mimeType, data: base64Image } },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4096,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        await response.text();
        lastError = new Error(
          `Fallback analysis service error: ${response.status} (${model})`
        );
        continue;
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        lastError = new Error(
          `No response from fallback analysis service (${model})`
        );
        continue;
      }
      return extractJson(content);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Fallback analysis failed");
}

async function analyzeWithPlantNet(
  base64Image: string,
  mimeType: string,
  imageType?: string,
  locale?: string
): Promise<PlantAnalysis> {
  const buffer = Buffer.from(base64Image, "base64");
  const identification = await identifyWithPlantNet(
    buffer,
    mimeType,
    imageType
  );

  if (!identification || identification.rejected) {
    const fa = locale === "fa";
    const base = withMeta(
      {
        plant: {
          commonName: fa ? "گیاه شناسایی نشد" : "Plant not identified",
          commonNameEn: "Plant not identified",
          commonNameFa: "گیاه شناسایی نشد",
          scientificName: identification?.scientificNameWithAuthor || "",
          family: identification?.family || "",
          confidence: Math.round((identification?.score || 0) * 100),
          description: fa
            ? "با این تصویر گونه با اطمینان کافی شناسایی نشد. عکس واضح‌تری از برگ یا گل بگیرید."
            : "Could not identify this species confidently. Take a clearer photo of a leaf or flower.",
          category: "",
          uses: "",
        },
        health: {
          status: "unknown",
          possibleProblems: [],
          diseaseDiagnosis: [],
          pestDiagnosis: [],
          soilAnalysis: fa
            ? "گونه گیاه با اطمینان کافی شناسایی نشد."
            : "Could not identify the plant species with enough confidence.",
          confidence: 0,
        },
        care: {
          watering: "—",
          light: "—",
          soil: "—",
          fertilizer: "—",
          temperature: "—",
          humidity: "—",
        },
        treatment: {
          immediateActions: [
            fa
              ? "عکس واضح‌تری از برگ یا گل بگیرید."
              : "Take a clearer photo of a leaf or flower.",
          ],
          stepByStepPlan: [],
          prevention: [],
          warnings: [],
        },
      },
      {
        speciesSource: "plantnet",
        healthSource: "none",
        diseaseModelUsed: false,
        diseaseModelLabels: [],
      }
    );
    return enrichWithHealthAnalysis(
      base,
      base64Image,
      mimeType,
      imageType,
      locale
    );
  }

  const catalog = await findCatalogByScientificName(
    identification.scientificName,
    locale
  );
  const base = buildAnalysisFromCatalog(
    catalog,
    identification,
    locale,
    imageType
  );
  return enrichWithHealthAnalysis(
    base,
    base64Image,
    mimeType,
    imageType,
    locale
  );
}

async function analyzeWithLlm(
  base64Image: string,
  mimeType: string,
  imageType?: string,
  locale?: string
): Promise<PlantAnalysis> {
  const rawProvider =
    process.env.ANALYSIS_PROVIDER || process.env.AI_PROVIDER || "primary";

  if (rawProvider === "plantnet") {
    throw new Error("PlantNet provider selected");
  }

  const provider =
    rawProvider === "openai" || rawProvider === "primary"
      ? "primary"
      : rawProvider === "gemini" || rawProvider === "fallback"
        ? "fallback"
        : "primary";

  try {
    let result: PlantAnalysis;
    if (provider === "fallback") {
      result = await analyzeWithGemini(base64Image, mimeType, imageType, locale);
    } else {
      result = await analyzeWithOpenAI(base64Image, mimeType, imageType, locale);
    }
    result = withMeta(result, {
      speciesSource: "llm",
      healthSource: "vision",
      diseaseModelUsed: false,
      diseaseModelLabels: [],
    });
    return enrichWithHealthAnalysis(
      result,
      base64Image,
      mimeType,
      imageType,
      locale
    );
  } catch (primaryError) {
    if (provider === "primary" && getFallbackAnalysisKey()) {
      const result = withMeta(
        await analyzeWithGemini(base64Image, mimeType, imageType, locale),
        {
          speciesSource: "llm",
          healthSource: "vision",
          diseaseModelUsed: false,
          diseaseModelLabels: [],
        }
      );
      return enrichWithHealthAnalysis(
        result,
        base64Image,
        mimeType,
        imageType,
        locale
      );
    }
    if (provider === "fallback" && getPrimaryAnalysisKey()) {
      const result = withMeta(
        await analyzeWithOpenAI(base64Image, mimeType, imageType, locale),
        {
          speciesSource: "llm",
          healthSource: "vision",
          diseaseModelUsed: false,
          diseaseModelLabels: [],
        }
      );
      return enrichWithHealthAnalysis(
        result,
        base64Image,
        mimeType,
        imageType,
        locale
      );
    }
    throw primaryError;
  }
}

export async function analyzePlantImage(
  base64Image: string,
  mimeType: string,
  options?: { imageType?: string; locale?: string }
): Promise<PlantAnalysis> {
  if (!hasAnalysisConfigured()) {
    return getUnconfiguredAnalysis(options?.locale);
  }

  const preferPlantNet =
    process.env.ANALYSIS_PROVIDER === "plantnet" ||
    process.env.ANALYSIS_PROVIDER === "hybrid" ||
    (!hasLlmAnalysisConfigured() && !!getPlantNetApiKey());

  if (preferPlantNet && getPlantNetApiKey()) {
    return analyzeWithPlantNet(
      base64Image,
      mimeType,
      options?.imageType,
      options?.locale
    );
  }

  try {
    return await analyzeWithLlm(
      base64Image,
      mimeType,
      options?.imageType,
      options?.locale
    );
  } catch {
    if (getPlantNetApiKey()) {
      return analyzeWithPlantNet(
        base64Image,
        mimeType,
        options?.imageType,
        options?.locale
      );
    }
    throw new Error("Plant analysis failed");
  }
}

export async function fileToBase64(
  file: File
): Promise<{ base64: string; mimeType: string; buffer: Buffer }> {
  const { fileToValidatedBuffer } = await import("@/lib/image-validation");
  return fileToValidatedBuffer(file);
}
