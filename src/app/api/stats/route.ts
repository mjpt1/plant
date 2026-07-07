import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [scans, users, questions, plants] = await Promise.all([
      prisma.scanHistory.count(),
      prisma.user.count(),
      prisma.question.count(),
      prisma.plantCatalog.count(),
    ]);

    return NextResponse.json({
      stats: { scans, users, questions, plants },
    });
  } catch {
    return NextResponse.json({
      stats: { scans: 0, users: 0, questions: 0, plants: 0 },
    });
  }
}
