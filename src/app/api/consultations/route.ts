import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isExpert = user.role === "EXPERT" || user.role === "ADMIN";
  const consultations = await prisma.expertConsultation.findMany({
    where: isExpert
      ? { OR: [{ userId: user.id }, { status: "OPEN" }, { expertId: user.id }] }
      : { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      user: { select: { name: true, username: true } },
      expert: { select: { name: true, username: true } },
    },
  });

  return NextResponse.json({ consultations });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  const plantId =
    typeof body.plantId === "string" && body.plantId ? body.plantId : null;
  const imageUrl =
    typeof body.imageUrl === "string" && body.imageUrl ? body.imageUrl : null;

  if (!subject || !message) {
    return NextResponse.json(
      { error: "Subject and message required" },
      { status: 400 }
    );
  }

  const consultation = await prisma.expertConsultation.create({
    data: {
      userId: user.id,
      subject: subject.slice(0, 160),
      message: message.slice(0, 4000),
      plantId,
      imageUrl,
    },
  });

  return NextResponse.json({ consultation });
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || (user.role !== "EXPERT" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id || "");
  const reply = String(body.reply || "").trim();
  if (!id || !reply) {
    return NextResponse.json({ error: "id and reply required" }, { status: 400 });
  }

  const consultation = await prisma.expertConsultation.update({
    where: { id },
    data: {
      reply: reply.slice(0, 4000),
      status: "ANSWERED",
      expertId: user.id,
    },
  });

  return NextResponse.json({ consultation });
}
