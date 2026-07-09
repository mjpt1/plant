import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import {
  buildReminderNotificationPayload,
  findDueReminders,
  getDueReminderWindow,
} from "@/lib/reminders-due";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const lookahead = parseInt(searchParams.get("lookahead") || "5", 10);
    const overdue = parseInt(searchParams.get("overdue") || "1440", 10);

    const window = getDueReminderWindow({
      lookaheadMinutes: Number.isNaN(lookahead) ? 5 : lookahead,
      overdueMinutes: Number.isNaN(overdue) ? 24 * 60 : overdue,
    });

    const reminders = await findDueReminders(user.id, window);

    return NextResponse.json({
      reminders: reminders.map((reminder) => ({
        ...buildReminderNotificationPayload(reminder),
        scheduledAt: reminder.scheduledAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
