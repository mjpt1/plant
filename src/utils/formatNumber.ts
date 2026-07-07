import type { Locale } from "@/i18n";
import { toPersianDigits } from "@/utils/dateHelper";

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  const formatted = new Intl.NumberFormat(
    locale === "fa" ? "fa-IR" : "en-US",
    options
  ).format(value);

  return locale === "fa" ? toPersianDigits(formatted) : formatted;
}

export function formatPercent(value: number, locale: Locale): string {
  const text = `${value}%`;
  return locale === "fa" ? toPersianDigits(text) : text;
}

export function formatCompactNumber(value: number, locale: Locale): string {
  if (value >= 1000) {
    const compact = `${(value / 1000).toFixed(1)}K+`;
    return locale === "fa" ? toPersianDigits(compact) : compact;
  }

  return formatNumber(value, locale);
}
