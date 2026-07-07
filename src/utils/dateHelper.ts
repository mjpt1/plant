import { format as formatGregorian, type Locale as DateFnsLocale } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  format as formatJalali,
  newDate,
} from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import { toGregorian, isLeapJalaaliYear } from "jalaali-js";
import type { Locale } from "@/i18n";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

export function formatDate(
  date: Date | string | number,
  locale: Locale,
  formatStr?: string
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;

  if (locale === "fa") {
    const jalaliFormat = formatStr ?? "yyyy/MM/dd";
    const formatted = formatJalali(d, jalaliFormat, { locale: faIR });
    return toPersianDigits(formatted);
  }

  const gregorianFormat = formatStr ?? "yyyy-MM-dd";
  return formatGregorian(d, gregorianFormat, { locale: enUS });
}

export function formatDateTime(
  date: Date | string | number,
  locale: Locale
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;

  if (locale === "fa") {
    const formatted = formatJalali(d, "yyyy/MM/dd HH:mm", { locale: faIR });
    return toPersianDigits(formatted);
  }

  return formatGregorian(d, "yyyy-MM-dd HH:mm", { locale: enUS });
}

export function formatRelativeMonthYear(date: Date, locale: Locale): string {
  if (locale === "fa") {
    const formatted = formatJalali(date, "MMMM yyyy", { locale: faIR });
    return toPersianDigits(formatted);
  }
  return formatGregorian(date, "MMMM yyyy", { locale: enUS });
}

export function formatDayOfWeek(date: Date, locale: Locale): string {
  if (locale === "fa") {
    const formatted = formatJalali(date, "EEEE", { locale: faIR });
    return toPersianDigits(formatted);
  }
  return formatGregorian(date, "EEEE", { locale: enUS });
}

export function parseInputDate(value: string, locale: Locale): Date {
  if (locale === "fa") {
    const normalized = value.replace(/[۰-۹]/g, (d) =>
      String(PERSIAN_DIGITS.indexOf(d))
    );
    const parts = normalized.split(/[\/\-]/).map(Number);
    if (parts.length === 3) {
      const [jy, jm, jd] = parts;
      const { gy, gm, gd } = toGregorian(jy, jm, jd);
      return new Date(gy, gm - 1, gd);
    }
  }

  const parts = value.split(/[\/\-]/).map(Number);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
  }

  return new Date(value);
}

export function getTodayString(locale: Locale): string {
  return formatDate(new Date(), locale);
}

export function getCalendarDays(year: number, month: number, locale: Locale): Date[] {
  const days: Date[] = [];

  if (locale === "fa") {
    const jm = month + 1;
    const firstDay = newDate(year, month, 1);
    const startWeekday = firstDay.getDay();

    let daysInMonth = 31;
    if (jm >= 7 && jm <= 11) daysInMonth = 30;
    if (jm === 12) daysInMonth = isLeapJalaaliYear(year) ? 30 : 29;

    for (let i = 0; i < startWeekday; i++) {
      days.push(new Date(0));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(newDate(year, month, d));
    }
  } else {
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startWeekday; i++) {
      days.push(new Date(0));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
  }

  return days;
}

export function getCurrentCalendarMonth(locale: Locale): { year: number; month: number } {
  const now = new Date();
  if (locale === "fa") {
    const jalaliStr = formatJalali(now, "yyyy/MM");
    const [jy, jm] = jalaliStr.split("/").map(Number);
    return { year: jy, month: jm - 1 };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function isSameCalendarDay(a: Date, b: Date, locale: Locale): boolean {
  if (locale === "fa") {
    const fa = formatJalali(a, "yyyy/MM/dd");
    const fb = formatJalali(b, "yyyy/MM/dd");
    return fa === fb;
  }
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date, locale: Locale): boolean {
  return isSameCalendarDay(date, new Date(), locale);
}

export function getDateFnsLocale(locale: Locale): DateFnsLocale {
  return locale === "fa" ? (faIR as unknown as DateFnsLocale) : enUS;
}

export { toGregorian };
