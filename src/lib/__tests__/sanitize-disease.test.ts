import { describe, expect, it } from "vitest";
import { sanitizeDiseaseLabels } from "@/types/analysis";

describe("sanitizeDiseaseLabels", () => {
  it("removes watering mislabels", () => {
    expect(
      sanitizeDiseaseLabels([
        "Powdery mildew",
        "Underwatering",
        "کم آبی",
        "کمبود آب",
        "Root rot",
      ])
    ).toEqual(["Powdery mildew", "Root rot"]);
  });

  it("keeps real pathology", () => {
    expect(sanitizeDiseaseLabels(["سفیدک پودری", "شپشک آردی"])).toEqual([
      "سفیدک پودری",
      "شپشک آردی",
    ]);
  });
});
