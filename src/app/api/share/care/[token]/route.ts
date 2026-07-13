import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const link = await prisma.careShareLink.findUnique({
    where: { token: params.token },
    include: {
      plant: {
        select: {
          nameEn: true,
          nameFa: true,
          scientificName: true,
          imageUrl: true,
          healthStatus: true,
          environment: true,
          carePlan: true,
          careReminders: {
            where: { completed: false },
            orderBy: { scheduledAt: "asc" },
            take: 8,
            select: {
              titleEn: true,
              titleFa: true,
              type: true,
              scheduledAt: true,
            },
          },
        },
      },
      user: { select: { name: true, username: true } },
    },
  });

  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  return NextResponse.json({
    sharedBy: link.user,
    plant: link.plant,
    expiresAt: link.expiresAt,
  });
}
