import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plant = await prisma.plant.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!plant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const link = await prisma.careShareLink.create({
    data: {
      plantId: params.id,
      userId: user.id,
      expiresAt,
    },
  });

  return NextResponse.json({
    token: link.token,
    path: `/share/care/${link.token}`,
    expiresAt: link.expiresAt,
  });
}
