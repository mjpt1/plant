import { describe, it, expect } from "vitest";
import {
  getNextRecurringDate,
  getPlantActivityField,
} from "@/lib/reminder-utils";

describe("getNextRecurringDate", () => {
  it("adds 7 days for weekly", () => {
    const from = new Date("2026-03-07T10:00:00Z");
    const next = getNextRecurringDate(from, "weekly");
    expect(next.getDate()).toBe(14);
  });

  it("adds 1 month for monthly", () => {
    const from = new Date("2026-03-07T10:00:00Z");
    const next = getNextRecurringDate(from, "monthly");
    expect(next.getMonth()).toBe(3);
  });
});

describe("getPlantActivityField", () => {
  it("maps watering to lastWateredAt", () => {
    expect(getPlantActivityField("watering")).toBe("lastWateredAt");
  });

  it("maps fertilizing to lastFertilizedAt", () => {
    expect(getPlantActivityField("fertilizing")).toBe("lastFertilizedAt");
  });
});
