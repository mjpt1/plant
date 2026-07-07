import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  toPersianDigits,
  parseInputDate,
} from "@/utils/dateHelper";
import {
  formatCompactNumber,
  formatNumber,
  formatPercent,
} from "@/utils/formatNumber";

describe("toPersianDigits", () => {
  it("converts western digits", () => {
    expect(toPersianDigits("2026-03-07")).toBe("۲۰۲۶-۰۳-۰۷");
  });
});

describe("formatDate", () => {
  const date = new Date("2026-03-07T12:00:00Z");

  it("formats Gregorian dates in English", () => {
    expect(formatDate(date, "en")).toMatch(/2026-03-07/);
  });

  it("formats Jalali dates with Persian digits in Persian", () => {
    const formatted = formatDate(date, "fa");
    expect(formatted).toMatch(/[۰-۹]{4}\/[۰-۹]{2}\/[۰-۹]{2}/);
  });
});

describe("formatDateTime", () => {
  const date = new Date("2026-03-07T15:30:00Z");

  it("uses Gregorian format for English", () => {
    expect(formatDateTime(date, "en")).toContain("2026-03-07");
  });

  it("uses Jalali format for Persian", () => {
    expect(formatDateTime(date, "fa")).toMatch(/[۰-۹]/);
  });
});

describe("parseInputDate", () => {
  it("parses Gregorian input", () => {
    const parsed = parseInputDate("2026-03-07", "en");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(7);
  });

  it("parses Jalali input with Persian digits", () => {
    const parsed = parseInputDate("۱۴۰۴/۱۲/۱۷", "fa");
    expect(parsed.getFullYear()).toBeGreaterThan(2020);
  });
});

describe("formatNumber", () => {
  it("formats numbers for English", () => {
    expect(formatNumber(1234, "en")).toBe("1,234");
  });

  it("formats numbers with Persian digits for Persian", () => {
    expect(formatNumber(1234, "fa")).toBe("۱٬۲۳۴");
  });
});

describe("formatPercent", () => {
  it("formats percent for Persian UI", () => {
    expect(formatPercent(87, "fa")).toBe("۸۷%");
  });
});

describe("formatCompactNumber", () => {
  it("formats compact values", () => {
    expect(formatCompactNumber(2500, "en")).toBe("2.5K+");
    expect(formatCompactNumber(2500, "fa")).toBe("۲.۵K+");
  });
});
