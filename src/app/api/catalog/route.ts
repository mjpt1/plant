import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  cacheGetJson,
  cacheSetJson,
  catalogSearchKey,
} from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const indoor = searchParams.get("indoor");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10), 100);
    const skip = (page - 1) * limit;

    const cacheKey = catalogSearchKey({
      q: q.toLowerCase().trim(),
      category,
      indoor: indoor || "",
      page,
      limit,
    });
    const cached = await cacheGetJson<{
      plants: unknown[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      categories: unknown[];
      cached: boolean;
    }>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const andFilters: Prisma.PlantCatalogWhereInput[] = [
      { OR: [{ isUserSubmitted: false }, { isApproved: true }] },
    ];

    if (q) {
      andFilters.push({
        OR: [
          { nameEn: { contains: q } },
          { nameFa: { contains: q } },
          { scientificName: { contains: q } },
        ],
      });
    }
    if (category && category !== "all") {
      andFilters.push({ category });
    }
    if (indoor === "true") {
      andFilters.push({ isIndoor: true });
    }

    const where: Prisma.PlantCatalogWhereInput = { AND: andFilters };

    const [plants, total, categories] = await Promise.all([
      prisma.plantCatalog.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isIndoor: "desc" }, { nameEn: "asc" }],
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameFa: true,
          scientificName: true,
          category: true,
          categoryFa: true,
          waterRequirement: true,
          sunRequirement: true,
          difficulty: true,
          isIndoor: true,
          imageUrl: true,
          source: true,
          toxicity: true,
        },
      }),
      prisma.plantCatalog.count({ where }),
      prisma.plantCatalog.groupBy({
        by: ["category", "categoryFa"],
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
      }),
    ]);

    const payload = {
      plants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      categories: categories.map((c) => ({
        category: c.category,
        categoryFa: c.categoryFa,
        count: c._count.category,
      })),
      cached: false,
    };

    await cacheSetJson(cacheKey, payload, 600);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET catalog error:", error);
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nameEn,
      nameFa,
      scientificName,
      category,
      description,
      wateringGuide,
      lightGuide,
      fertilizerGuide,
      soilGuide,
      toxicity,
      difficulty,
      isIndoor,
      imageUrl,
    } = body;

    if (!nameEn?.trim() || !nameFa?.trim()) {
      return NextResponse.json(
        { error: "English and Persian names are required" },
        { status: 400 }
      );
    }

    const { getCategoryFa } = await import("@/data/plantNames");
    const cat = category || "houseplant";
    const baseSlug = nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `user-${baseSlug}-${Date.now()}`;

    const plant = await prisma.plantCatalog.create({
      data: {
        externalId: `user-${user.id}-${Date.now()}`,
        slug,
        nameEn: nameEn.trim(),
        nameFa: nameFa.trim(),
        scientificName: scientificName?.trim() || null,
        category: cat,
        categoryFa: getCategoryFa(cat),
        description: description?.trim() || null,
        wateringGuide: wateringGuide?.trim() || null,
        lightGuide: lightGuide?.trim() || null,
        fertilizerGuide: fertilizerGuide?.trim() || null,
        soilGuide: soilGuide?.trim() || null,
        toxicity: toxicity?.trim() || null,
        difficulty: difficulty?.trim() || "moderate",
        waterRequirement: wateringGuide?.toLowerCase().includes("low")
          ? "low"
          : wateringGuide?.toLowerCase().includes("high")
          ? "high"
          : "medium",
        sunRequirement: lightGuide?.slice(0, 120) || null,
        soilType: soilGuide?.slice(0, 120) || null,
        isIndoor: isIndoor !== false,
        isContainerFriendly: true,
        imageUrl: imageUrl || null,
        source: "community",
        addedByUserId: user.id,
        isUserSubmitted: true,
        isApproved: false,
      },
    });

    return NextResponse.json({ plant });
  } catch (error) {
    console.error("POST catalog error:", error);
    return NextResponse.json({ error: "Failed to add plant" }, { status: 500 });
  }
}
