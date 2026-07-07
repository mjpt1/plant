import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { reminderSchema, reminderUpdateSchema } from "@/lib/validations/plant";
import { apiError } from "@/lib/api-error";
import {
  getNextRecurringDate,
  getPlantActivityField,
} from "@/lib/reminder-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const completed = searchParams.get("completed");

    const where: {
      userId: string;
      scheduledAt?: { gte: Date; lte: Date };
      completed?: boolean;
    } = {
      userId: user.id,
    };

    if (completed === "true") where.completed = true;
    if (completed === "false") where.completed = false;

    if (month !== null && year !== null && month !== "" && year !== "") {
      const monthIndex = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      if (!Number.isNaN(monthIndex) && !Number.isNaN(yearNum)) {
        const start = new Date(yearNum, monthIndex, 1);
        const end = new Date(yearNum, monthIndex + 1, 0, 23, 59, 59, 999);
        where.scheduledAt = { gte: start, lte: end };
      }
    }

    const reminders = await prisma.careReminder.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        plant: {
          select: { id: true, nameEn: true, nameFa: true },
        },
      },
    });

    return NextResponse.json({
      reminders: reminders.map((r) => ({
        ...r,
        scheduledAt: r.scheduledAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = reminderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.plantId) {
      const plant = await prisma.plant.findFirst({
        where: { id: data.plantId, userId: user.id },
      });
      if (!plant) {
        return NextResponse.json({ error: "Plant not found" }, { status: 404 });
      }
    }

    const reminder = await prisma.careReminder.create({
      data: {
        userId: user.id,
        titleEn: data.titleEn,
        titleFa: data.titleFa,
        type: data.type,
        scheduledAt: new Date(data.scheduledAt),
        plantId: data.plantId || null,
        recurring: data.recurring || null,
        notes: data.notes || null,
      },
      include: {
        plant: {
          select: { id: true, nameEn: true, nameFa: true },
        },
      },
    });

    return NextResponse.json({
      reminder: {
        ...reminder,
        scheduledAt: reminder.scheduledAt.toISOString(),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

async function completeReminder(
  userId: string,
  reminder: {
    id: string;
    userId: string;
    plantId: string | null;
    type: string;
    recurring: string | null;
    scheduledAt: Date;
    titleEn: string;
    titleFa: string;
    notes: string | null;
  }
) {
  const updated = await prisma.careReminder.update({
    where: { id: reminder.id },
    data: { completed: true },
    include: {
      plant: { select: { id: true, nameEn: true, nameFa: true } },
    },
  });

  if (reminder.plantId) {
    const activityField = getPlantActivityField(reminder.type);
    if (activityField) {
      await prisma.plant.update({
        where: { id: reminder.plantId },
        data: { [activityField]: new Date() },
      });
    }
  }

  let nextReminder = null;
  if (reminder.recurring) {
    const nextDate = getNextRecurringDate(
      reminder.scheduledAt,
      reminder.recurring
    );
    nextReminder = await prisma.careReminder.create({
      data: {
        userId,
        plantId: reminder.plantId,
        titleEn: reminder.titleEn,
        titleFa: reminder.titleFa,
        type: reminder.type,
        scheduledAt: nextDate,
        recurring: reminder.recurring,
        notes: reminder.notes,
        completed: false,
      },
      include: {
        plant: { select: { id: true, nameEn: true, nameFa: true } },
      },
    });
  }

  return {
    reminder: {
      ...updated,
      scheduledAt: updated.scheduledAt.toISOString(),
    },
    nextReminder: nextReminder
      ? {
          ...nextReminder,
          scheduledAt: nextReminder.scheduledAt.toISOString(),
        }
      : null,
  };
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = reminderUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const existing = await prisma.careReminder.findUnique({
      where: { id: parsed.data.id },
    });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (parsed.data.completed === true && !existing.completed) {
      const result = await completeReminder(user.id, existing);
      return NextResponse.json(result);
    }

    if (parsed.data.plantId) {
      const plant = await prisma.plant.findFirst({
        where: { id: parsed.data.plantId, userId: user.id },
      });
      if (!plant) {
        return NextResponse.json({ error: "Plant not found" }, { status: 404 });
      }
    }

    const reminder = await prisma.careReminder.update({
      where: { id: parsed.data.id },
      data: {
        ...(parsed.data.completed !== undefined && {
          completed: parsed.data.completed,
        }),
        ...(parsed.data.titleEn !== undefined && { titleEn: parsed.data.titleEn }),
        ...(parsed.data.titleFa !== undefined && { titleFa: parsed.data.titleFa }),
        ...(parsed.data.type !== undefined && { type: parsed.data.type }),
        ...(parsed.data.scheduledAt !== undefined && {
          scheduledAt: new Date(parsed.data.scheduledAt),
        }),
        ...(parsed.data.plantId !== undefined && {
          plantId: parsed.data.plantId,
        }),
        ...(parsed.data.recurring !== undefined && {
          recurring: parsed.data.recurring,
        }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      },
      include: {
        plant: { select: { id: true, nameEn: true, nameFa: true } },
      },
    });

    return NextResponse.json({
      reminder: {
        ...reminder,
        scheduledAt: reminder.scheduledAt.toISOString(),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Reminder ID required" }, { status: 400 });
    }

    const existing = await prisma.careReminder.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.careReminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
