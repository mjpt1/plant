import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);

    const [
      users,
      scans,
      posts,
      questions,
      comments,
      likes,
      pendingReports,
      pendingCatalog,
      experts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.scanHistory.count(),
      prisma.post.count(),
      prisma.question.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.plantCatalog.count({ where: { isUserSubmitted: true, isApproved: false } }),
      prisma.user.count({ where: { role: Role.EXPERT } }),
    ]);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    return NextResponse.json({
      stats: {
        users,
        scans,
        posts,
        questions,
        comments,
        likes,
        pendingReports,
        pendingCatalog,
        experts,
        recentUsers,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
