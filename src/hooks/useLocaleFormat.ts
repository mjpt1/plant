"use client";

import { useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatDate,
  formatDateTime,
  formatDayOfWeek,
  formatRelativeMonthYear,
} from "@/utils/dateHelper";
import {
  formatCompactNumber,
  formatNumber,
  formatPercent,
} from "@/utils/formatNumber";

export function useLocaleFormat() {
  const { locale } = useLanguage();

  return useMemo(
    () => ({
      locale,
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, locale, options),
      formatPercent: (value: number) => formatPercent(value, locale),
      formatCompactNumber: (value: number) => formatCompactNumber(value, locale),
      formatDate: (
        date: Date | string | number,
        formatStr?: string
      ) => formatDate(date, locale, formatStr),
      formatDateTime: (date: Date | string | number) =>
        formatDateTime(date, locale),
      formatRelativeMonthYear: (date: Date) =>
        formatRelativeMonthYear(date, locale),
      formatDayOfWeek: (date: Date) => formatDayOfWeek(date, locale),
    }),
    [locale]
  );
}
