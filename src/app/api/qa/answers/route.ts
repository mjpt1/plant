import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { voteSchema, verifyAnswerSchema } from "@/lib/validations/qa";
import { getVoteScore } from "@/lib/qa-votes";
import { apiError } from "@/lib/api-error";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { answerId, value } = parsed.data;

    const existing = await prisma.vote.findUnique({
      where: {
        answerId_userId: {
          answerId,
          userId: user.id,
        },
      },
    });

    let userVote: -1 | 0 | 1;

    if (existing) {
      if (existing.value === value) {
        await prisma.vote.delete({
          where: {
            answerId_userId: { answerId, userId: user.id },
          },
        });
        userVote = 0;
      } else {
        await prisma.vote.update({
          where: {
            answerId_userId: { answerId, userId: user.id },
          },
          data: { value },
        });
        userVote = value;
      }
    } else {
      await prisma.vote.create({
        data: { answerId, userId: user.id, value },
      });
      userVote = value;
    }

    const voteCount = await getVoteScore(answerId);

    return NextResponse.json({ userVote, voteCount });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const answerId = searchParams.get("answerId");
    if (!answerId) {
      return NextResponse.json({ error: "answerId required" }, { status: 400 });
    }

    await prisma.vote.deleteMany({ where: { answerId, userId: user.id } });
    const voteCount = await getVoteScore(answerId);
    return NextResponse.json({ userVote: 0, voteCount });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.EXPERT && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = verifyAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const answer = await prisma.answer.update({
      where: { id: parsed.data.answerId },
      data: { isExpertVerified: parsed.data.verified },
      select: { id: true, isExpertVerified: true },
    });

    return NextResponse.json({ answer });
  } catch (error) {
    return apiError(error);
  }
}
