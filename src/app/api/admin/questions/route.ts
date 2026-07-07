import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { content: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, username: true } },
        _count: { select: { answers: true } },
      },
    });

    return NextResponse.json({
      questions: questions.map((q) => ({
        id: q.id,
        title: q.title,
        category: q.category,
        solved: q.solved,
        createdAt: q.createdAt.toISOString(),
        user: q.user,
        answerCount: q._count.answers,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Question id required" }, { status: 400 });
    }

    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
