import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import type { PlantAnalysis } from "@/types/analysis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [profile, plants, upcomingReminders, recentScans, stats] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            country: true,
            city: true,
            bio: true,
            role: true,
            createdAt: true,
          },
        }),
        prisma.plant.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 6,
          include: { _count: { select: { careReminders: true } } },
        }),
        prisma.careReminder.findMany({
          where: {
            userId: user.id,
            completed: false,
            scheduledAt: { lte: weekLater },
          },
          orderBy: { scheduledAt: "asc" },
          take: 8,
          include: {
            plant: { select: { id: true, nameEn: true, nameFa: true } },
          },
        }),
        prisma.scanHistory.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            plantData: true,
            healthData: true,
            imageUrl: true,
            createdAt: true,
          },
        }),
        Promise.all([
          prisma.plant.count({ where: { userId: user.id } }),
          prisma.careReminder.count({
            where: { userId: user.id, completed: false },
          }),
          prisma.scanHistory.count({ where: { userId: user.id } }),
          prisma.post.count({ where: { userId: user.id } }),
          prisma.question.count({ where: { userId: user.id } }),
        ]),
      ]);

    const [plantCount, reminderCount, scanCount, postCount, questionCount] = stats;

    return NextResponse.json({
      profile,
      plants: plants.map((p) => ({
        ...p,
        acquiredAt: p.acquiredAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      upcomingReminders: upcomingReminders.map((r) => ({
        ...r,
        scheduledAt: r.scheduledAt.toISOString(),
      })),
      recentScans: recentScans.map((s) => {
        const plantData = s.plantData as PlantAnalysis["plant"];
        const healthData = s.healthData as PlantAnalysis["health"];
        return {
          id: s.id,
          plantNameEn: plantData?.commonName || "Unknown",
          plantNameFa: plantData?.commonName || "نامشخص",
          healthStatus: healthData?.status || "unknown",
          confidence: plantData?.confidence || 0,
          createdAt: s.createdAt.toISOString(),
          imageUrl: s.imageUrl,
        };
      }),
      stats: {
        plants: plantCount,
        reminders: reminderCount,
        scans: scanCount,
        posts: postCount,
        questions: questionCount,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
