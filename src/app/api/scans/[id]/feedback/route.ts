import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

const feedbackSchema = z.object({
  wasCorrect: z.boolean(),
  correctedLabel: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const scanId = params.id;
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid feedback" },
        { status: 400 }
      );
    }

    const scan = await prisma.scanHistory.findFirst({
      where: { id: scanId, userId: user.id },
      select: { id: true },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    const feedback = await prisma.diagnosisFeedback.upsert({
      where: {
        scanId_userId: { scanId, userId: user.id },
      },
      create: {
        scanId,
        userId: user.id,
        wasCorrect: parsed.data.wasCorrect,
        correctedLabel: parsed.data.wasCorrect
          ? null
          : parsed.data.correctedLabel || null,
        notes: parsed.data.notes || null,
      },
      update: {
        wasCorrect: parsed.data.wasCorrect,
        correctedLabel: parsed.data.wasCorrect
          ? null
          : parsed.data.correctedLabel || null,
        notes: parsed.data.notes || null,
      },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const feedback = await prisma.diagnosisFeedback.findUnique({
      where: {
        scanId_userId: { scanId: params.id, userId: user.id },
      },
    });
    return NextResponse.json({ feedback });
  } catch (error) {
    return apiError(error);
  }
}
