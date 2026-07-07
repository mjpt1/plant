import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { reportSchema } from "@/lib/validations/social";
import { apiError } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        reason: parsed.data.reason,
        details: parsed.data.details || null,
      },
    });

    return NextResponse.json({ report: { id: report.id } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
