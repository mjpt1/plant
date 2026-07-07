import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { applyCarePlan } from "@/lib/plantCare";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await applyCarePlan(params.id, user.id);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const reminders = await prisma.careReminder.findMany({
      where: { plantId: params.id, userId: user.id, completed: false },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({
      carePlan: result,
      reminders: reminders.map((r) => ({
        ...r,
        scheduledAt: r.scheduledAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("POST schedule error:", error);
    return NextResponse.json({ error: "Failed to generate schedule" }, { status: 500 });
  }
}
