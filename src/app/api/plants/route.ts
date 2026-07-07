import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { applyCarePlan } from "@/lib/plantCare";
import { toJsonValue } from "@/lib/jsonFields";
import { plantSchema } from "@/lib/validations/plant";
import { apiError } from "@/lib/api-error";

export async function GET() {
  try {
    const user = await requireAuth();

    const plants = await prisma.plant.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            careReminders: { where: { completed: false } },
          },
        },
      },
    });

    return NextResponse.json({
      plants: plants.map((p) => ({
        ...p,
        acquiredAt: p.acquiredAt.toISOString(),
        lastWateredAt: p.lastWateredAt?.toISOString() ?? null,
        lastFertilizedAt: p.lastFertilizedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = plantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const {
      nameEn,
      nameFa,
      scientificName,
      imageUrl,
      healthStatus,
      environment,
      notes,
      careGuide,
      generateSchedule,
      catalogId,
    } = parsed.data;

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { country: true, city: true },
    });

    if (!fullUser?.country || !fullUser?.city) {
      return NextResponse.json(
        {
          error: "LOCATION_REQUIRED",
          message: "Please set your country and city in profile first",
        },
        { status: 400 }
      );
    }

    const plant = await prisma.plant.create({
      data: {
        userId: user.id,
        nameEn: nameEn.trim(),
        nameFa: nameFa.trim(),
        scientificName: scientificName || null,
        imageUrl: imageUrl || null,
        healthStatus,
        environment,
        notes: notes || null,
        catalogId: catalogId || null,
        careGuide: careGuide ? toJsonValue(careGuide) : undefined,
      },
    });

    if (generateSchedule !== false) {
      await applyCarePlan(plant.id, user.id);
    }

    const updated = await prisma.plant.findUnique({
      where: { id: plant.id },
      include: { _count: { select: { careReminders: true } } },
    });

    return NextResponse.json({
      plant: {
        ...updated,
        acquiredAt: updated!.acquiredAt.toISOString(),
        createdAt: updated!.createdAt.toISOString(),
        updatedAt: updated!.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
