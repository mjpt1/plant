import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildReminderNotificationPayload,
  findAllDueRemindersForPush,
  getDueReminderWindow,
} from "@/lib/reminders-due";
import { sendWebPushNotification } from "@/lib/web-push-server";

function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const window = getDueReminderWindow({
    lookaheadMinutes: 15,
    overdueMinutes: 60,
  });

  const reminders = await findAllDueRemindersForPush(window);
  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const payload = buildReminderNotificationPayload(reminder);
    const subscriptions = reminder.user.pushSubscriptions;

    if (subscriptions.length === 0) {
      continue;
    }

    const title = reminder.titleFa || reminder.titleEn;
    const plantName = reminder.plant?.nameFa || reminder.plant?.nameEn;
    const body = plantName ? `${title} — ${plantName}` : title;

    let delivered = false;

    for (const sub of subscriptions) {
      try {
        await sendWebPushNotification(sub, {
          title,
          body,
          url: payload.url,
          tag: `care-reminder-${reminder.id}`,
          locale: "fa",
        });
        delivered = true;
        sent++;
      } catch {
        await prisma.pushSubscription.deleteMany({
          where: { id: sub.id },
        });
        failed++;
      }
    }

    if (delivered) {
      await prisma.careReminder.update({
        where: { id: reminder.id },
        data: { notifiedAt: new Date() },
      });
    }
  }

  return NextResponse.json({
    checked: reminders.length,
    sent,
    failed,
  });
}
