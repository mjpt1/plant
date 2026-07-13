import { z } from "zod";

export const healthStatusSchema = z.enum([
  "healthy",
  "warning",
  "critical",
  "unknown",
]);

export const analysisSpeciesSourceSchema = z.enum([
  "plantnet",
  "llm",
  "catalog",
  "none",
]);

export const analysisHealthSourceSchema = z.enum([
  "vision",
  "disease_model",
  "heuristic",
  "none",
]);

export const analysisMetaSchema = z.object({
  speciesSource: analysisSpeciesSourceSchema.default("none"),
  healthSource: analysisHealthSourceSchema.default("none"),
  diseaseModelUsed: z.boolean().default(false),
  diseaseModelLabels: z
    .array(
      z.object({
        label: z.string(),
        score: z.number().min(0).max(1),
      })
    )
    .default([]),
});

export const plantAnalysisSchema = z.object({
  plant: z.object({
    commonName: z.string(),
    commonNameEn: z.string().optional().default(""),
    commonNameFa: z.string().optional().default(""),
    scientificName: z.string(),
    family: z.string(),
    confidence: z.number().min(0).max(100),
    description: z.string().optional().default(""),
    category: z.string().optional().default(""),
    uses: z.string().optional().default(""),
  }),
  health: z.object({
    status: healthStatusSchema,
    possibleProblems: z.array(z.string()),
    diseaseDiagnosis: z.array(z.string()),
    pestDiagnosis: z.array(z.string()),
    soilAnalysis: z.string(),
    confidence: z.number().min(0).max(100),
  }),
  care: z.object({
    watering: z.string(),
    light: z.string(),
    soil: z.string(),
    fertilizer: z.string(),
    temperature: z.string(),
    humidity: z.string(),
  }),
  treatment: z.object({
    immediateActions: z.array(z.string()),
    stepByStepPlan: z.array(z.string()),
    prevention: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
  meta: analysisMetaSchema.optional(),
});

export type PlantAnalysis = z.infer<typeof plantAnalysisSchema>;
export type AnalysisMeta = z.infer<typeof analysisMetaSchema>;

export type ImageScanType =
  | "leaf"
  | "stem"
  | "flower"
  | "fruit"
  | "root"
  | "soil"
  | "pest"
  | "full_plant";

export const imageScanTypeSchema = z.enum([
  "leaf",
  "stem",
  "flower",
  "fruit",
  "root",
  "soil",
  "pest",
  "full_plant",
]);

/** Strip watering advice that LLMs often mis-label as disease. */
export function sanitizeDiseaseLabels(labels: string[]): string[] {
  const wateringPattern =
    /under\s*water|over\s*water|کم\s*آبی|کم‌آبی|کمبود\s*آب|تشنگی|خشکی\s*خاک|آبیاری\s*(?:کم|زیاد|ناکافی|بیش\s*از\s*حد)|آب\s*دهی|water(?:ing)?\s*(?:stress|issue|problem)?|drought\s*stress|too\s*dry|too\s*wet|dehydrat/i;
  return labels.filter((label) => !wateringPattern.test(label));
}

/** After stripping watering mislabels, keep status consistent with remaining findings. */
export function reconcileHealthStatus(health: {
  status: "healthy" | "warning" | "critical" | "unknown";
  diseaseDiagnosis: string[];
  pestDiagnosis: string[];
  possibleProblems: string[];
}): "healthy" | "warning" | "critical" | "unknown" {
  const diseases = sanitizeDiseaseLabels(health.diseaseDiagnosis);
  const pests = health.pestDiagnosis.filter(Boolean);
  const problems = health.possibleProblems.filter(Boolean);

  if (diseases.length === 0 && pests.length === 0) {
    if (health.status === "critical" || health.status === "warning") {
      return problems.length > 0 ? "warning" : "unknown";
    }
    if (health.status === "healthy" && problems.length > 0) {
      return "warning";
    }
  }
  if (diseases.length > 0 || pests.length > 0) {
    if (health.status === "healthy" || health.status === "unknown") {
      return "warning";
    }
  }
  return health.status;
}
