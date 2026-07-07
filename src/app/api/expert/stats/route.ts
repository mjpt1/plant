import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole(Role.EXPERT, Role.ADMIN);

    const [answerCount, acceptedCount, verifiedCount, openQuestions] = await Promise.all([
      prisma.answer.count({ where: { userId: user.id } }),
      prisma.answer.count({ where: { userId: user.id, isAccepted: true } }),
      prisma.answer.count({ where: { userId: user.id, isExpertVerified: true } }),
      prisma.question.count({
        where: {
          solved: false,
          answers: { none: {} },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        answers: answerCount,
        accepted: acceptedCount,
        verified: verifiedCount,
        openQuestions,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
