import { prisma } from "@/lib/prisma";

export type DueReminderWindow = {
  windowStart: Date;
  windowEnd: Date;
};

export function getDueReminderWindow(options?: {
  lookaheadMinutes?: number;
  overdueMinutes?: number;
}): DueReminderWindow {
  const now = Date.now();
  const lookaheadMinutes = options?.lookaheadMinutes ?? 5;
  const overdueMinutes = options?.overdueMinutes ?? 24 * 60;

  return {
    windowStart: new Date(now - overdueMinutes * 60_000),
    windowEnd: new Date(now + lookaheadMinutes * 60_000),
  };
}

export async function findDueReminders(
  userId: string,
  window: DueReminderWindow,
  options?: { onlyUnnotified?: boolean }
) {
  return prisma.careReminder.findMany({
    where: {
      userId,
      completed: false,
      scheduledAt: { gte: window.windowStart, lte: window.windowEnd },
      ...(options?.onlyUnnotified ? { notifiedAt: null } : {}),
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      plant: { select: { id: true, nameEn: true, nameFa: true } },
    },
  });
}

export async function findAllDueRemindersForPush(window: DueReminderWindow) {
  return prisma.careReminder.findMany({
    where: {
      completed: false,
      notifiedAt: null,
      scheduledAt: { gte: window.windowStart, lte: window.windowEnd },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      plant: { select: { id: true, nameEn: true, nameFa: true } },
      user: {
        select: {
          id: true,
          pushSubscriptions: true,
        },
      },
    },
  });
}

export function buildReminderNotificationPayload(reminder: {
  id: string;
  titleEn: string;
  titleFa: string;
  type: string;
  plantId: string | null;
  plant?: { nameEn: string; nameFa: string } | null;
}) {
  const plantLabelEn = reminder.plant?.nameEn;
  const plantLabelFa = reminder.plant?.nameFa;
  const url = reminder.plantId
    ? `/plants/${reminder.plantId}`
    : "/calendar";

  return {
    id: reminder.id,
    titleEn: reminder.titleEn,
    titleFa: reminder.titleFa,
    type: reminder.type,
    plantId: reminder.plantId,
    plantNameEn: plantLabelEn ?? null,
    plantNameFa: plantLabelFa ?? null,
    url,
  };
}
