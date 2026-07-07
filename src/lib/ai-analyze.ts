import { plantAnalysisSchema, type PlantAnalysis } from "@/types/analysis";

function getPrimaryAnalysisKey(): string | undefined {
  return process.env.ANALYSIS_PRIMARY_KEY || process.env.OPENAI_API_KEY;
}

function getFallbackAnalysisKey(): string | undefined {
  return process.env.ANALYSIS_FALLBACK_KEY || process.env.GEMINI_API_KEY;
}

function hasAnalysisConfigured(): boolean {
  return !!(getPrimaryAnalysisKey() || getFallbackAnalysisKey());
}

export function isDemoAnalysisMode(): boolean {
  return !hasAnalysisConfigured();
}

/** @deprecated Use isDemoAnalysisMode */
export function isDemoAiMode(): boolean {
  return isDemoAnalysisMode();
}

function getDemoAnalysis(locale?: string, imageType?: string): PlantAnalysis {
  const fa = locale === "fa";
  const typeLabel = imageType?.replace("_", " ") || "plant";

  return {
    plant: {
      commonName: fa ? "مانسترا" : "Monstera",
      scientificName: "Monstera deliciosa",
      family: fa ? "توفیجیان" : "Araceae",
      confidence: 87,
    },
    health: {
      status: "healthy",
      possibleProblems: fa
        ? ["برگ‌های پایینی قهوه‌ای (طبیعی)", "نیاز به حمایت برای رشد"]
        : ["Lower leaf browning (normal)", "May need support as it grows"],
      diseaseDiagnosis: [],
      pestDiagnosis: [],
      soilAnalysis: fa
        ? "خاک با زهکشی خوب و رطوبت متوسط مناسب به نظر می‌رسد."
        : "Soil appears well-draining with moderate moisture.",
      confidence: 82,
    },
    care: {
      watering: fa
        ? "وقتی ۲ سانتی‌متر بالای خاک خشک شد آبیاری کنید."
        : "Water when the top 2cm of soil is dry.",
      light: fa ? "نور غیرمستقیم روشن." : "Bright indirect light.",
      soil: fa ? "مخلوط گلدان با زهکشی خوب." : "Well-draining potting mix.",
      fertilizer: fa ? "ماهانه در بهار و تابستان." : "Monthly in spring and summer.",
      temperature: fa ? "۱۸ تا ۲۷ درجه سانتی‌گراد." : "18–27°C.",
      humidity: fa ? "رطوبت ۵۰٪ به بالا." : "50%+ humidity preferred.",
    },
    treatment: {
      immediateActions: fa
        ? ["برگ‌های زرد پایینی را جدا کنید", "گلدان را بچرخانید برای نور یکنواخت"]
        : ["Remove yellowing lower leaves", "Rotate pot for even light"],
      stepByStepPlan: fa
        ? ["برنامه آبیاری هفتگی تنظیم کنید", "برگ‌ها را با پارچه مرطوب گردگیری کنید"]
        : ["Set a weekly watering schedule", "Wipe leaves with a damp cloth"],
      prevention: fa
        ? ["از آب‌دهی بیش از حد پرهیز کنید", "از نور مستقیم ظهر اجتناب کنید"]
        : ["Avoid overwatering", "Keep away from harsh midday sun"],
      warnings: fa
        ? [`تحلیل دمو بر اساس نوع تصویر: ${typeLabel}`]
        : [`Demo analysis based on image type: ${typeLabel}`],
    },
  };
}

const ANALYSIS_PROMPT = `You are an expert botanist and plant pathologist. Analyze this plant-related image and return ONLY valid JSON (no markdown) with this exact structure:

{
  "plant": {
    "commonName": "",
    "scientificName": "",
    "family": "",
    "confidence": 0
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

Your analysis MUST cover:
1. Plant identification (common name, scientific name, family) with plant.confidence (0-100)
2. Disease signs and likely diagnoses in health.diseaseDiagnosis
3. Soil condition assessment in health.soilAnalysis (moisture, drainage, compaction, nutrients if visible)
4. Pest signs in health.pestDiagnosis (insects, mites, fungal spots, holes, webs, etc.)
5. A practical treatment plan in treatment (immediateActions, stepByStepPlan, prevention, warnings)
6. Overall plant health status and health.confidence (0-100)

Rules:
- confidence values are 0-100 integers
- If healthy, diseaseDiagnosis and pestDiagnosis can be empty arrays but soilAnalysis must still describe visible soil/substrate
- Provide at least 2 items in stepByStepPlan when problems exist, otherwise 2 general care steps
- Provide at least 2 prevention tips
- immediateActions: urgent steps if unhealthy, otherwise general care actions
- Be specific and practical for home gardeners`;

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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
    throw new Error(`Fallback analysis service error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("No response from fallback analysis service");
  return extractJson(content);
}

export async function analyzePlantImage(
  base64Image: string,
  mimeType: string,
  options?: { imageType?: string; locale?: string }
): Promise<PlantAnalysis> {
  if (!hasAnalysisConfigured()) {
    return getDemoAnalysis(options?.locale, options?.imageType);
  }

  const rawProvider =
    process.env.ANALYSIS_PROVIDER || process.env.AI_PROVIDER || "primary";
  const provider =
    rawProvider === "openai" || rawProvider === "primary"
      ? "primary"
      : rawProvider === "gemini" || rawProvider === "fallback"
        ? "fallback"
        : "primary";

  try {
    if (provider === "fallback") {
      return await analyzeWithGemini(
        base64Image,
        mimeType,
        options?.imageType,
        options?.locale
      );
    }
    return await analyzeWithOpenAI(
      base64Image,
      mimeType,
      options?.imageType,
      options?.locale
    );
  } catch (primaryError) {
    if (provider === "primary" && getFallbackAnalysisKey()) {
      return analyzeWithGemini(
        base64Image,
        mimeType,
        options?.imageType,
        options?.locale
      );
    }
    if (provider === "fallback" && getPrimaryAnalysisKey()) {
      return analyzeWithOpenAI(
        base64Image,
        mimeType,
        options?.imageType,
        options?.locale
      );
    }
    throw primaryError;
  }
}

export async function fileToBase64(
  file: File
): Promise<{ base64: string; mimeType: string; buffer: Buffer }> {
  const { fileToValidatedBuffer } = await import("@/lib/image-validation");
  const validated = await fileToValidatedBuffer(file);
  return validated;
}
