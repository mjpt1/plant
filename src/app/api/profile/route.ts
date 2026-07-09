import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validations/auth";
import { apiError } from "@/lib/api-error";
import { regenerateAllCarePlansForUser } from "@/lib/plantCare";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        country: true,
        city: true,
        role: true,
        _count: { select: { plants: true } },
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { country: true, city: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await prisma.user.update({
      where: { id: user.id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        country: true,
        city: true,
        role: true,
      },
    });

    const locationChanged =
      (parsed.data.city != null &&
        parsed.data.city.trim() !== (existing.city || "").trim()) ||
      (parsed.data.country != null &&
        parsed.data.country.trim() !== (existing.country || "").trim());

    let schedulesRegenerated = 0;
    if (
      locationChanged &&
      profile.city?.trim() &&
      profile.country?.trim()
    ) {
      const updated = await regenerateAllCarePlansForUser(user.id);
      schedulesRegenerated = updated.length;
    }

    return NextResponse.json({ profile, schedulesRegenerated });
  } catch (error) {
    return apiError(error);
  }
}
