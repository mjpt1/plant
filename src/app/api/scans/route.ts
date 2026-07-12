import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import type { PlantAnalysis } from "@/types/analysis";

export const dynamic = "force-dynamic";

function formatScan(scan: {
  id: string;
  imageUrl: string;
  imageType: string | null;
  plantData: unknown;
  healthData: unknown;
  careData: unknown;
  treatmentData: unknown;
  metaData?: unknown;
  plantId: string | null;
  createdAt: Date;
}) {
  return {
    id: scan.id,
    imageUrl: scan.imageUrl,
    imageType: scan.imageType,
    plantId: scan.plantId,
    plant: scan.plantData as PlantAnalysis["plant"],
    health: scan.healthData as PlantAnalysis["health"],
    care: scan.careData as PlantAnalysis["care"],
    treatment: scan.treatmentData as PlantAnalysis["treatment"],
    meta: (scan.metaData as PlantAnalysis["meta"]) || undefined,
    createdAt: scan.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const skip = (page - 1) * limit;

    if (id) {
      const scan = await prisma.scanHistory.findFirst({
        where: { id, userId: user.id },
      });
      if (!scan) {
        return NextResponse.json({ error: "Scan not found" }, { status: 404 });
      }
      return NextResponse.json({ scan: formatScan(scan) });
    }

    const [scans, total] = await Promise.all([
      prisma.scanHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.scanHistory.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      scans: scans.map(formatScan),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return apiError(error);
  }
}
