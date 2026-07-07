import { describe, it, expect } from "vitest";
import {
  validateImageBuffer,
  validateImageFile,
  parseBase64ImagePayload,
  MAX_IMAGE_BYTES,
} from "@/lib/image-validation";
import { analyzeResponseSchema } from "@/types/analyze-api";

describe("image validation", () => {
  it("accepts valid jpeg buffer", () => {
    const buffer = Buffer.alloc(1024, 1);
    expect(() => validateImageBuffer(buffer, "image/jpeg")).not.toThrow();
  });

  it("rejects oversized buffer", () => {
    const buffer = Buffer.alloc(MAX_IMAGE_BYTES + 1);
    expect(() => validateImageBuffer(buffer, "image/jpeg")).toThrow(/10MB/);
  });

  it("rejects invalid mime type", () => {
    const buffer = Buffer.alloc(10);
    expect(() => validateImageBuffer(buffer, "application/pdf")).toThrow(
      /Invalid file type/
    );
  });

  it("validates File size and type", () => {
    const file = {
      type: "image/png",
      size: 100,
    } as File;
    expect(() => validateImageFile(file)).not.toThrow();
  });

  it("parses base64 data urls", () => {
    const tinyPng = Buffer.from("abc").toString("base64");
    const parsed = parseBase64ImagePayload(`data:image/png;base64,${tinyPng}`);
    expect(parsed.mimeType).toBe("image/png");
    expect(parsed.base64).toBe(tinyPng);
  });
});

describe("analyzeResponseSchema", () => {
  it("validates a complete analyze response", () => {
    const payload = {
      success: true as const,
      scanId: "scan_123",
      imageUrl: "https://res.cloudinary.com/demo/image.jpg",
      locale: "fa" as const,
      demo: false,
      confidence: { plant: 90, health: 85 },
      data: {
        plant: {
          commonName: "مانسترا",
          scientificName: "Monstera deliciosa",
          family: "Araceae",
          confidence: 90,
        },
        health: {
          status: "healthy" as const,
          possibleProblems: [],
          diseaseDiagnosis: [],
          pestDiagnosis: [],
          soilAnalysis: "خاک با زهکشی مناسب",
          confidence: 85,
        },
        care: {
          watering: "هفتگی",
          light: "نور غیرمستقیم",
          soil: "خاک سبک",
          fertilizer: "ماهانه",
          temperature: "۲۰ درجه",
          humidity: "۵۰٪",
        },
        treatment: {
          immediateActions: ["بررسی رطوبت"],
          stepByStepPlan: ["آبیاری منظم"],
          prevention: ["از آب‌دهی زیاد پرهیز کنید"],
          warnings: [],
        },
      },
    };

    expect(analyzeResponseSchema.safeParse(payload).success).toBe(true);
  });
});
