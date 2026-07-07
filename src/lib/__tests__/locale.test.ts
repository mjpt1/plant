import { describe, it, expect } from "vitest";
import {
  getDirection,
  parseLocale,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
} from "@/lib/locale";

describe("parseLocale", () => {
  it("accepts supported locales", () => {
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("fa")).toBe("fa");
  });

  it("rejects invalid locales", () => {
    expect(parseLocale("fr")).toBeNull();
    expect(parseLocale(null)).toBeNull();
  });
});

describe("getDirection", () => {
  it("returns rtl for Persian", () => {
    expect(getDirection("fa")).toBe("rtl");
  });

  it("returns ltr for English", () => {
    expect(getDirection("en")).toBe("ltr");
  });
});

describe("locale constants", () => {
  it("uses shared storage keys", () => {
    expect(LOCALE_COOKIE_NAME).toBe("plantcare-locale");
    expect(LOCALE_STORAGE_KEY).toBe("plantcare-locale");
  });
});
