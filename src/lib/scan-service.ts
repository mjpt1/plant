import { prisma } from "@/lib/prisma";
import {
  isCloudinaryConfigured,
  uploadImageBuffer,
} from "@/lib/cloudinary";
import { toJsonValue } from "@/lib/jsonFields";
import type { PlantAnalysis } from "@/types/analysis";

export async function uploadScanImage(
  buffer: Buffer,
  mimeType: string,
  base64: string,
  userId: string
): Promise<string> {
  if (isCloudinaryConfigured()) {
    const uploaded = await uploadImageBuffer(
      buffer,
      `plantcare/${userId}/scans`
    );
    return uploaded.url;
  }

  return `data:${mimeType};base64,${base64}`;
}

export async function saveScanResult(input: {
  userId: string;
  imageUrl: string;
  imageType?: string;
  analysis: PlantAnalysis;
  plantId?: string;
}) {
  return prisma.scanHistory.create({
    data: {
      userId: input.userId,
      plantId: input.plantId,
      imageUrl: input.imageUrl,
      imageType: input.imageType || "full_plant",
      plantData: toJsonValue(input.analysis.plant),
      healthData: toJsonValue(input.analysis.health),
      careData: toJsonValue(input.analysis.care),
      treatmentData: toJsonValue(input.analysis.treatment),
    },
  });
}
