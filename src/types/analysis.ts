import { z } from "zod";

export const healthStatusSchema = z.enum([
  "healthy",
  "warning",
  "critical",
  "unknown",
]);

export const plantAnalysisSchema = z.object({
  plant: z.object({
    commonName: z.string(),
    scientificName: z.string(),
    family: z.string(),
    confidence: z.number().min(0).max(100),
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
});

export type PlantAnalysis = z.infer<typeof plantAnalysisSchema>;

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
