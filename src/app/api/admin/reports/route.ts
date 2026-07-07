import { NextRequest, NextResponse } from "next/server";
import { ReportStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { adminReportReviewSchema } from "@/lib/validations/admin";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ReportStatus | "ALL" | null;

    const reports = await prisma.report.findMany({
      where:
        status && status !== "ALL" && Object.values(ReportStatus).includes(status)
          ? { status }
          : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        reporter: { select: { id: true, name: true, username: true } },
      },
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireRole(Role.ADMIN);
    const body = await request.json();
    const parsed = adminReportReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { reportId, status, hideTarget } = parsed.data;

    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedById: admin.id,
      },
    });

    if (hideTarget) {
      switch (report.targetType) {
        case "POST":
          await prisma.post.update({
            where: { id: report.targetId },
            data: { isHidden: true },
          });
          break;
        case "COMMENT":
          await prisma.comment.update({
            where: { id: report.targetId },
            data: { isHidden: true },
          });
          break;
        case "QUESTION":
          await prisma.question.delete({ where: { id: report.targetId } });
          break;
        case "ANSWER":
          await prisma.answer.delete({ where: { id: report.targetId } });
          break;
        default:
          break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
