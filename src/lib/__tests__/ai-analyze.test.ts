import { describe, it, expect } from "vitest";
import { plantAnalysisSchema } from "@/types/analysis";
import { isDemoAnalysisMode } from "@/lib/ai-analyze";

describe("plantAnalysisSchema", () => {
  it("requires confidence scores", () => {
    const result = plantAnalysisSchema.safeParse({
      plant: {
        commonName: "Monstera",
        scientificName: "Monstera deliciosa",
        family: "Araceae",
        confidence: 88,
      },
      health: {
        status: "healthy",
        possibleProblems: [],
        diseaseDiagnosis: [],
        pestDiagnosis: [],
        soilAnalysis: "Well-draining soil",
        confidence: 80,
      },
      care: {
        watering: "Weekly",
        light: "Bright indirect",
        soil: "Potting mix",
        fertilizer: "Monthly",
        temperature: "20C",
        humidity: "50%",
      },
      treatment: {
        immediateActions: ["Check moisture"],
        stepByStepPlan: ["Water weekly"],
        prevention: ["Avoid overwatering"],
        warnings: [],
      },
    });

    expect(result.success).toBe(true);
  });
});

describe("isDemoAnalysisMode", () => {
  it("returns true when no analysis keys are configured", () => {
    const originalPrimary = process.env.ANALYSIS_PRIMARY_KEY;
    const originalFallback = process.env.ANALYSIS_FALLBACK_KEY;
    delete process.env.ANALYSIS_PRIMARY_KEY;
    delete process.env.ANALYSIS_FALLBACK_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    expect(isDemoAnalysisMode()).toBe(true);

    process.env.ANALYSIS_PRIMARY_KEY = originalPrimary;
    process.env.ANALYSIS_FALLBACK_KEY = originalFallback;
  });
});
