import { describe, it, expect } from "vitest";
import {
  localizePlantName,
  localizePlantText,
  isPrimarilyPersian,
  resolveBilingualNames,
} from "@/lib/plant-locale";

describe("plant-locale", () => {
  it("returns Persian common name for known plants", () => {
    expect(
      localizePlantName(
        {
          nameEn: "Monstera Deliciosa",
          nameFa: "مانسترا دلیسیوسا",
          scientificName: "Monstera deliciosa",
          category: "houseplant",
          categoryFa: "گیاه آپارتمانی",
        },
        "fa"
      )
    ).toBe("مانسترا");
  });

  it("returns English name for English locale", () => {
    expect(
      localizePlantName(
        {
          nameEn: "Monstera Deliciosa",
          nameFa: "مانسترا",
          scientificName: "Monstera deliciosa",
          category: "houseplant",
        },
        "en"
      )
    ).toBe("Monstera Deliciosa");
  });

  it("uses category + scientific for obscure WCVP entries in FA", () => {
    const name = localizePlantName(
      {
        nameEn: "Rosa damascena",
        nameFa: "رزا داماسکنا",
        scientificName: "Rosa damascena",
        category: "rose",
        categoryFa: "گل رز",
      },
      "fa"
    );
    expect(name).toBe("گل محمدی");
  });

  it("translates English care text to Persian", () => {
    const fa = localizePlantText("Place in bright indirect light.", "fa");
    expect(fa).toBeTruthy();
    expect(isPrimarilyPersian(fa!)).toBe(true);
    expect(fa).toContain("نور");
  });

  it("keeps Persian distribution text in FA mode", () => {
    const text = "پراکنش: ایران، ترکیه";
    expect(localizePlantText(text, "fa")).toBe(text);
  });

  it("resolves bilingual names for scan save", () => {
    const pair = resolveBilingualNames(
      "Monstera Deliciosa",
      "مانسترا دلیسیوسا",
      "Monstera deliciosa",
      "houseplant"
    );
    expect(pair.nameEn).toBe("Monstera Deliciosa");
    expect(pair.nameFa).toBe("مانسترا");
  });
});
