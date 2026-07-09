import { describe, it, expect } from "vitest";
import {
  computeWateringAdjustment,
  isRainyDay,
  shiftPastRain,
  type WeatherForecast,
} from "@/lib/weather";

function makeForecast(daily: WeatherForecast["daily"]): WeatherForecast {
  return {
    locationName: "Tehran",
    latitude: 35.68,
    longitude: 51.38,
    daily,
    fetchedAt: new Date("2026-07-09T09:00:00Z"),
  };
}

describe("weather watering adjustment", () => {
  it("increases watering frequency in hot dry weather", () => {
    const forecast = makeForecast([
      { date: "2026-07-10", tempMax: 36, tempMin: 24, precipitation: 0, humidity: 25 },
      { date: "2026-07-11", tempMax: 38, tempMin: 25, precipitation: 0, humidity: 22 },
      { date: "2026-07-12", tempMax: 37, tempMin: 26, precipitation: 0, humidity: 28 },
    ]);
    const insight = computeWateringAdjustment(forecast);
    expect(insight.adjustment).toBeGreaterThan(1.2);
  });

  it("reduces watering when rain is forecast", () => {
    const forecast = makeForecast([
      { date: "2026-07-10", tempMax: 22, tempMin: 16, precipitation: 12, humidity: 80 },
      { date: "2026-07-11", tempMax: 20, tempMin: 15, precipitation: 8, humidity: 85 },
      { date: "2026-07-12", tempMax: 21, tempMin: 14, precipitation: 5, humidity: 78 },
    ]);
    const insight = computeWateringAdjustment(forecast);
    expect(insight.adjustment).toBeLessThan(1);
  });

  it("shifts watering away from rainy days", () => {
    const forecast = makeForecast([
      { date: "2026-07-10", tempMax: 24, tempMin: 18, precipitation: 12, humidity: 70 },
      { date: "2026-07-11", tempMax: 25, tempMin: 19, precipitation: 0, humidity: 55 },
    ]);
    const rainy = new Date("2026-07-10T09:00:00Z");
    expect(isRainyDay(rainy, forecast)).toBe(true);
    const shifted = shiftPastRain(rainy, forecast);
    expect(shifted.toISOString().slice(0, 10)).toBe("2026-07-11");
  });
});
