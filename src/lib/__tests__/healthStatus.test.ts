import { describe, it, expect } from "vitest";
import { en } from "@/i18n/translations/en";
import {
  getHealthStatusLabel,
  normalizePlantHealthStatus,
} from "@/lib/healthStatus";

describe("healthStatus", () => {
  it("returns localized labels", () => {
    expect(getHealthStatusLabel("healthy", en)).toBe(en.scan.results.healthy);
    expect(getHealthStatusLabel("warning", en)).toBe(en.scan.results.warning);
    expect(getHealthStatusLabel("critical", en)).toBe(en.scan.results.critical);
  });

  it("falls back to raw status for unknown values", () => {
    expect(getHealthStatusLabel("custom", en)).toBe("custom");
  });

  it("normalizes health status", () => {
    expect(normalizePlantHealthStatus("warning")).toBe("warning");
    expect(normalizePlantHealthStatus("critical")).toBe("critical");
    expect(normalizePlantHealthStatus("healthy")).toBe("healthy");
    expect(normalizePlantHealthStatus("anything-else")).toBe("healthy");
  });
});
