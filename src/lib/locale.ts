import type { Locale } from "@/i18n";

export const LOCALE_STORAGE_KEY = "plantcare-locale";
export const LOCALE_COOKIE_NAME = "plantcare-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseLocale(value: string | null | undefined): Locale | null {
  if (value === "en" || value === "fa") return value;
  return null;
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "fa" ? "rtl" : "ltr";
}

export function readClientLocale(): Locale {
  if (typeof window === "undefined") return "en";

  const fromHtml = parseLocale(document.documentElement.lang);
  if (fromHtml) return fromHtml;

  const cookieMatch = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`)
  );
  const fromCookie = parseLocale(
    cookieMatch ? decodeURIComponent(cookieMatch[1]) : null
  );
  if (fromCookie) return fromCookie;

  try {
    const fromStorage = parseLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    if (fromStorage) return fromStorage;
  } catch {
    // localStorage may be blocked
  }

  return "en";
}

export function persistClientLocale(locale: Locale): void {
  if (typeof window === "undefined") return;

  const dir = getDirection(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};SameSite=Lax`;
}
