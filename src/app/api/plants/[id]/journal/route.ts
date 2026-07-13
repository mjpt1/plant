import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
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

  const entries = await prisma.plantJournalEntry.findMany({
    where: { plantId: params.id, userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ entries });
}

export async function POST(
  request: NextRequest,
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

  const body = await request.json();
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const imageUrl =
    typeof body.imageUrl === "string" ? body.imageUrl.trim() : null;

  if (!note && !imageUrl) {
    return NextResponse.json(
      { error: "Note or image required" },
      { status: 400 }
    );
  }

  const entry = await prisma.plantJournalEntry.create({
    data: {
      plantId: params.id,
      userId: user.id,
      note: note || null,
      imageUrl,
    },
  });

  return NextResponse.json({ entry });
}
