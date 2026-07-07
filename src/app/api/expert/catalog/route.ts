import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { expertInsightSchema } from "@/lib/validations/admin";
import { getExpertInsight, setExpertInsight } from "@/lib/catalog-extra";
import { toJsonValue } from "@/lib/jsonFields";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(Role.EXPERT, Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    const plants = await prisma.plantCatalog.findMany({
      where: {
        isApproved: true,
        ...(q
          ? {
              OR: [
                { nameEn: { contains: q, mode: "insensitive" } },
                { nameFa: { contains: q } },
                { scientificName: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: { nameEn: "asc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameFa: true,
        scientificName: true,
        category: true,
        rawData: true,
      },
    });

    return NextResponse.json({
      plants: plants.map((p) => ({
        id: p.id,
        slug: p.slug,
        nameEn: p.nameEn,
        nameFa: p.nameFa,
        scientificName: p.scientificName,
        category: p.category,
        expertInsight: getExpertInsight(p.rawData),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(Role.EXPERT, Role.ADMIN);
    const body = await request.json();
    const parsed = expertInsightSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const plant = await prisma.plantCatalog.findUnique({
      where: { id: parsed.data.catalogId },
    });
    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    const rawData = setExpertInsight(plant.rawData, parsed.data.expertInsight, user.id);

    await prisma.plantCatalog.update({
      where: { id: plant.id },
      data: { rawData: toJsonValue(rawData) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
