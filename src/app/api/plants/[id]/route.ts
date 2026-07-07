import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { applyCarePlan } from "@/lib/plantCare";
import { parseJson } from "@/lib/jsonFields";
import { plantUpdateSchema } from "@/lib/validations/plant";
import { apiError } from "@/lib/api-error";
import type { PlantAnalysis } from "@/types/analysis";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const plant = await prisma.plant.findUnique({
      where: { id: params.id },
      include: {
        careReminders: {
          where: { completed: false },
          orderBy: { scheduledAt: "asc" },
          take: 20,
        },
        scanHistory: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!plant || plant.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      plant: {
        ...plant,
        careGuide: parseJson(plant.careGuide, null),
        carePlan: parseJson(plant.carePlan, null),
        acquiredAt: plant.acquiredAt.toISOString(),
        lastWateredAt: plant.lastWateredAt?.toISOString() ?? null,
        lastFertilizedAt: plant.lastFertilizedAt?.toISOString() ?? null,
        createdAt: plant.createdAt.toISOString(),
        updatedAt: plant.updatedAt.toISOString(),
        careReminders: plant.careReminders.map((r) => ({
          ...r,
          scheduledAt: r.scheduledAt.toISOString(),
        })),
        scanHistory: plant.scanHistory.map((s) => {
          const plantData = s.plantData as PlantAnalysis["plant"];
          const healthData = s.healthData as PlantAnalysis["health"];
          return {
            id: s.id,
            imageUrl: s.imageUrl,
            plantNameEn: plantData?.commonName || "Unknown",
            plantNameFa: plantData?.commonName || "نامشخص",
            healthStatus: healthData?.status || "unknown",
            confidence: plantData?.confidence || 0,
            createdAt: s.createdAt.toISOString(),
          };
        }),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const existing = await prisma.plant.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = plantUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { nameEn, nameFa, healthStatus, environment, notes, imageUrl, regenerateSchedule } =
      parsed.data;

    const plant = await prisma.plant.update({
      where: { id: params.id },
      data: {
        ...(nameEn !== undefined && { nameEn }),
        ...(nameFa !== undefined && { nameFa }),
        ...(healthStatus !== undefined && { healthStatus }),
        ...(environment !== undefined && { environment }),
        ...(notes !== undefined && { notes }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
    });

    if (regenerateSchedule) {
      await applyCarePlan(plant.id, user.id);
    }

    const updated = await prisma.plant.findUnique({
      where: { id: plant.id },
      include: {
        careReminders: {
          where: { completed: false },
          orderBy: { scheduledAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      plant: {
        ...updated,
        acquiredAt: updated!.acquiredAt.toISOString(),
        createdAt: updated!.createdAt.toISOString(),
        updatedAt: updated!.updatedAt.toISOString(),
        careReminders: updated!.careReminders.map((r) => ({
          ...r,
          scheduledAt: r.scheduledAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const existing = await prisma.plant.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.plant.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
