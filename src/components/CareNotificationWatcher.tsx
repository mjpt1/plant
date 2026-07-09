"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  type DueReminderNotification,
  getNotificationPermission,
  isCareNotificationsEnabled,
  isNotificationSupported,
  showCareReminderNotification,
} from "@/lib/care-notifications";

const POLL_INTERVAL_MS = 60_000;

export function CareNotificationWatcher() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkDueReminders = useCallback(async () => {
    if (!user) return;
    if (!isNotificationSupported()) return;
    if (!isCareNotificationsEnabled()) return;
    if (getNotificationPermission() !== "granted") return;

    try {
      const res = await fetch("/api/reminders/due?lookahead=5&overdue=30");
      if (!res.ok) return;

      const data = (await res.json()) as { reminders: DueReminderNotification[] };
      for (const reminder of data.reminders) {
        await showCareReminderNotification(reminder, locale);
      }
    } catch {
      // Ignore transient network errors during polling.
    }
  }, [user, locale]);

  useEffect(() => {
    if (!user) return;
    if (!isCareNotificationsEnabled()) return;
    if (getNotificationPermission() !== "granted") return;

    void checkDueReminders();

    pollingRef.current = setInterval(() => {
      void checkDueReminders();
    }, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void checkDueReminders();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, checkDueReminders]);

  return null;
}
