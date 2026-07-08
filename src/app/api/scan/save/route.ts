import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { applyCarePlan } from "@/lib/plantCare";
import { toJsonValue } from "@/lib/jsonFields";
import { plantAnalysisSchema } from "@/types/analysis";
import { resolveBilingualNames } from "@/lib/plant-locale";
import { normalizePlantHealthStatus } from "@/lib/healthStatus";
import { apiError } from "@/lib/api-error";
import {
  isCloudinaryConfigured,
  uploadBase64Image,
} from "@/lib/cloudinary";

async function resolveImageUrl(
  imageUrl: string,
  userId: string
): Promise<string> {
  if (imageUrl.startsWith("http") || imageUrl.startsWith("inline:")) {
    return imageUrl;
  }
  if (isCloudinaryConfigured()) {
    const dataUrl = imageUrl.startsWith("data:")
      ? imageUrl
      : `data:image/jpeg;base64,${imageUrl}`;
    const uploaded = await uploadBase64Image(dataUrl, `plantcare/${userId}/scans`);
    return uploaded.url;
  }
  return `inline:${userId}:${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { analysis, imageUrl, environment, imageType, createPlant = true, scanId } =
      body;

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis is required" },
        { status: 400 }
      );
    }

    const parsed = plantAnalysisSchema.safeParse(analysis);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid analysis payload" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    let scan;
    if (scanId && typeof scanId === "string") {
      scan = await prisma.scanHistory.findFirst({
        where: { id: scanId, userId: user.id },
      });
      if (!scan) {
        return NextResponse.json({ error: "Scan not found" }, { status: 404 });
      }
    }

    const storedImageUrl = scan
      ? scan.imageUrl
      : imageUrl
        ? await resolveImageUrl(imageUrl, user.id)
        : null;

    if (!storedImageUrl) {
      return NextResponse.json(
        { error: "Image URL is required when scanId is not provided" },
        { status: 400 }
      );
    }

    if (!scan) {
      scan = await prisma.scanHistory.create({
        data: {
          userId: user.id,
          imageUrl: storedImageUrl,
          imageType: imageType || "full_plant",
          plantData: toJsonValue(data.plant),
          healthData: toJsonValue(data.health),
          careData: toJsonValue(data.care),
          treatmentData: toJsonValue(data.treatment),
        },
      });
    }

    if (!createPlant) {
      return NextResponse.json({ scanId: scan.id });
    }

    const bilingual = resolveBilingualNames(
      data.plant.commonNameEn || data.plant.commonName,
      data.plant.commonNameFa || data.plant.commonName,
      data.plant.scientificName,
      data.plant.category
    );

    const plant = await prisma.plant.create({
      data: {
        userId: user.id,
        nameEn: bilingual.nameEn,
        nameFa: bilingual.nameFa,
        scientificName: data.plant.scientificName,
        imageUrl: storedImageUrl,
        healthStatus: normalizePlantHealthStatus(data.health.status),
        environment: environment || "indoor",
        careGuide: toJsonValue(data.care),
      },
    });

    await prisma.scanHistory.update({
      where: { id: scan.id },
      data: { plantId: plant.id },
    });

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { country: true, city: true },
    });

    if (fullUser?.country && fullUser?.city) {
      await applyCarePlan(plant.id, user.id);
    }

    return NextResponse.json({
      plant: { id: plant.id, nameEn: plant.nameEn, nameFa: plant.nameFa },
      scanId: scan.id,
      scheduleGenerated: !!(fullUser?.country && fullUser?.city),
    });
  } catch (error) {
    return apiError(error);
  }
}
