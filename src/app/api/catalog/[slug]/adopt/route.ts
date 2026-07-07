import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { applyCarePlan } from "@/lib/plantCare";
import { toJsonValue } from "@/lib/jsonFields";

export async function POST(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const catalog = await prisma.plantCatalog.findUnique({
      where: { slug: params.slug },
    });
    if (!catalog) {
      return NextResponse.json({ error: "Plant not found in catalog" }, { status: 404 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { country: true, city: true },
    });

    const careGuide = {
      watering: catalog.wateringGuide || "",
      light: catalog.lightGuide || "",
      fertilizer: catalog.fertilizerGuide || "",
      soil: catalog.soilGuide || catalog.soilType || "",
    };

    const plant = await prisma.plant.create({
      data: {
        userId: user.id,
        catalogId: catalog.id,
        nameEn: catalog.nameEn,
        nameFa: catalog.nameFa,
        scientificName: catalog.scientificName,
        imageUrl: catalog.imageUrl,
        healthStatus: "healthy",
        environment: catalog.isIndoor ? "indoor" : "outdoor",
        careGuide: toJsonValue(careGuide),
        notes: catalog.description?.slice(0, 300) || null,
      },
    });

    if (fullUser?.country && fullUser?.city) {
      await applyCarePlan(plant.id, user.id);
    }

    return NextResponse.json({
      plant: { id: plant.id, nameEn: plant.nameEn, nameFa: plant.nameFa },
      scheduleGenerated: !!(fullUser?.country && fullUser?.city),
    });
  } catch (error) {
    console.error("Adopt catalog plant error:", error);
    return NextResponse.json({ error: "Failed to add plant" }, { status: 500 });
  }
}
