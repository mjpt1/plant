import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { questionSchema } from "@/lib/validations/qa";
import { parseTags } from "@/lib/jsonFields";
import { apiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const where: {
      category?: string;
      OR?: Array<
        | { title: { contains: string; mode: "insensitive" } }
        | { content: { contains: string; mode: "insensitive" } }
        | { tags: { has: string } }
      >;
    } = {};

    if (category && category !== "all") where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    const questions = await prisma.question.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { answers: true } },
      },
    });

    return NextResponse.json({
      questions: questions.map((q) => ({
        ...q,
        tags: parseTags(q.tags),
        createdAt: q.createdAt.toISOString(),
      })),
      page,
      limit,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        ...parsed.data,
        userId: user.id,
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { answers: true } },
      },
    });

    return NextResponse.json({
      question: {
        ...question,
        tags: question.tags,
        createdAt: question.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
