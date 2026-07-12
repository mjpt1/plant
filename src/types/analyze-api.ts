import { z } from "zod";
import { analysisMetaSchema, plantAnalysisSchema } from "@/types/analysis";

export const analyzeLocaleSchema = z.enum(["en", "fa"]);

export const analyzeResponseSchema = z.object({
  success: z.literal(true),
  data: plantAnalysisSchema,
  imageUrl: z.string(),
  scanId: z.string(),
  locale: analyzeLocaleSchema,
  demo: z.boolean(),
  confidence: z.object({
    plant: z.number().min(0).max(100),
    health: z.number().min(0).max(100),
  }),
  meta: analysisMetaSchema.optional(),
});

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
