import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { adminCatalogActionSchema } from "@/lib/validations/admin";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);

    const pending = await prisma.plantCatalog.findMany({
      where: { isUserSubmitted: true, isApproved: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        addedBy: { select: { id: true, name: true, username: true } },
      },
    });

    return NextResponse.json({
      plants: pending.map((p) => ({
        id: p.id,
        slug: p.slug,
        nameEn: p.nameEn,
        nameFa: p.nameFa,
        category: p.category,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
        addedBy: p.addedBy,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const body = await request.json();
    const parsed = adminCatalogActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { catalogId, action } = parsed.data;

    if (action === "approve") {
      await prisma.plantCatalog.update({
        where: { id: catalogId },
        data: { isApproved: true },
      });
      return NextResponse.json({ success: true, approved: true });
    }

    await prisma.plantCatalog.delete({ where: { id: catalogId } });
    return NextResponse.json({ success: true, approved: false });
  } catch (error) {
    return apiError(error);
  }
}
