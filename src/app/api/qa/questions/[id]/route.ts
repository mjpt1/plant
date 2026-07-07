import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAuth } from "@/lib/auth";
import { answerSchema } from "@/lib/validations/qa";
import { parseTags } from "@/lib/jsonFields";
import { getVoteScores, sortAnswers } from "@/lib/qa-votes";
import { apiError } from "@/lib/api-error";
import { Role } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();

    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, role: true } },
        answers: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true, role: true } },
            votes: user ? { where: { userId: user.id }, select: { value: true } } : false,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const voteScores = await getVoteScores(question.answers.map((a) => a.id));

    const answers = sortAnswers(
      question.answers.map((a) => ({
        id: a.id,
        content: a.content,
        isAccepted: a.isAccepted,
        isExpertVerified: a.isExpertVerified,
        createdAt: a.createdAt.toISOString(),
        user: a.user,
        voteCount: voteScores.get(a.id) ?? 0,
        userVote: (user ? a.votes[0]?.value ?? 0 : 0) as -1 | 0 | 1,
      }))
    );

    return NextResponse.json({
      question: {
        ...question,
        tags: parseTags(question.tags),
        createdAt: question.createdAt.toISOString(),
        answers,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = answerSchema.safeParse({ ...body, questionId: params.id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({ where: { id: params.id } });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isExpert = user.role === Role.EXPERT || user.role === Role.ADMIN;

    const answer = await prisma.answer.create({
      data: {
        questionId: params.id,
        userId: user.id,
        content: parsed.data.content,
        isExpertVerified: isExpert,
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, role: true } },
      },
    });

    return NextResponse.json({
      answer: {
        id: answer.id,
        content: answer.content,
        isAccepted: answer.isAccepted,
        isExpertVerified: answer.isExpertVerified,
        createdAt: answer.createdAt.toISOString(),
        user: answer.user,
        voteCount: 0,
        userVote: 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { answerId, accept } = body;

    const question = await prisma.question.findUnique({ where: { id: params.id } });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    if (question.userId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (accept && answerId) {
      const answer = await prisma.answer.findFirst({
        where: { id: answerId, questionId: params.id },
      });
      if (!answer) {
        return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      }

      await prisma.$transaction([
        prisma.answer.updateMany({
          where: { questionId: params.id },
          data: { isAccepted: false },
        }),
        prisma.answer.update({
          where: { id: answerId },
          data: { isAccepted: true },
        }),
        prisma.question.update({
          where: { id: params.id },
          data: { solved: true },
        }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
