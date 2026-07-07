import { describe, it, expect } from "vitest";
import { getExpertInsight, setExpertInsight } from "@/lib/catalog-extra";

describe("catalog-extra", () => {
  it("returns null when rawData is empty", () => {
    expect(getExpertInsight(null)).toBeNull();
    expect(getExpertInsight(undefined)).toBeNull();
  });

  it("reads expert insight from rawData", () => {
    const raw = {
      expertInsights: [{ text: "Water weekly in summer." }],
    };
    expect(getExpertInsight(raw)).toBe("Water weekly in summer.");
  });

  it("writes expert insight preserving other fields", () => {
    const updated = setExpertInsight({ faq: [{ q: "Q", a: "A" }] }, "Tip", "user-1");

    expect(updated.faq).toEqual([{ q: "Q", a: "A" }]);
    expect(getExpertInsight(updated)).toBe("Tip");
    expect(updated.expertInsights).toMatchObject([
      { text: "Tip", authorId: "user-1" },
    ]);
  });
});
