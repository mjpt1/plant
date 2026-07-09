import type { Locale } from "@/i18n";

export const CARE_NOTIFICATIONS_STORAGE_KEY = "giahyar-care-notifications-enabled";
export const CARE_NOTIFIED_SESSION_KEY = "giahyar-notified-reminder-ids";

export type DueReminderNotification = {
  id: string;
  titleEn: string;
  titleFa: string;
  type: string;
  plantId: string | null;
  plantNameEn: string | null;
  plantNameFa: string | null;
  scheduledAt: string;
  url: string;
};

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function isCareNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CARE_NOTIFICATIONS_STORAGE_KEY) === "true";
}

export function setCareNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARE_NOTIFICATIONS_STORAGE_KEY, enabled ? "true" : "false");
}

function getNotifiedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(CARE_NOTIFIED_SESSION_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveNotifiedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CARE_NOTIFIED_SESSION_KEY, JSON.stringify(Array.from(ids)));
}

export function markReminderNotifiedInSession(id: string): void {
  const ids = getNotifiedIds();
  ids.add(id);
  saveNotifiedIds(ids);
}

export function wasReminderNotifiedInSession(id: string): boolean {
  return getNotifiedIds().has(id);
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function getTypeLabel(type: string, locale: Locale): string {
  const labels: Record<string, { en: string; fa: string }> = {
    watering: { en: "Watering", fa: "آبیاری" },
    fertilizing: { en: "Fertilizing", fa: "کوددهی" },
    pruning: { en: "Pruning", fa: "هرس" },
    repotting: { en: "Repotting", fa: "تعویض گلدان" },
    inspection: { en: "Inspection", fa: "بازرسی" },
  };
  const entry = labels[type];
  if (!entry) return type;
  return locale === "fa" ? entry.fa : entry.en;
}

export async function showCareReminderNotification(
  reminder: DueReminderNotification,
  locale: Locale
): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  if (wasReminderNotifiedInSession(reminder.id)) return;

  const plantName =
    locale === "fa"
      ? reminder.plantNameFa || reminder.plantNameEn
      : reminder.plantNameEn || reminder.plantNameFa;

  const title =
    locale === "fa"
      ? reminder.titleFa || reminder.titleEn
      : reminder.titleEn || reminder.titleFa;

  const typeLabel = getTypeLabel(reminder.type, locale);
  const body = plantName
    ? locale === "fa"
      ? `${typeLabel} — ${plantName}`
      : `${typeLabel} — ${plantName}`
    : typeLabel;

  const options: NotificationOptions = {
    body,
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: `care-reminder-${reminder.id}`,
    data: { url: reminder.url, reminderId: reminder.id },
    lang: locale === "fa" ? "fa" : "en",
    dir: locale === "fa" ? "rtl" : "ltr",
  };

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      markReminderNotifiedInSession(reminder.id);
      return;
    }
  }

  new Notification(title, options);
  markReminderNotifiedInSession(reminder.id);
}

export async function subscribeToWebPush(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return false;
  }

  const keyRes = await fetch("/api/push/vapid-public-key");
  if (!keyRes.ok) return false;

  const { publicKey } = (await keyRes.json()) as { publicKey?: string };
  if (!publicKey) return false;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  return res.ok;
}

export async function unsubscribeFromWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  await subscription.unsubscribe();
}
