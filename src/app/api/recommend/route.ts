import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  scorePlantForConditions,
  reasonLabel,
  type LightBand,
} from "@/lib/plant-recommend";
import {
  computeWateringAdjustment,
  fetchWeatherForLocation,
} from "@/lib/weather";

export const dynamic = "force-dynamic";

const BANDS = new Set(["dark", "low", "medium", "bright", "direct"]);

export async function GET(request: NextRequest) {
  const lightParam = request.nextUrl.searchParams.get("light") || "medium";
  const light = (BANDS.has(lightParam) ? lightParam : "medium") as LightBand;
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "fa";
  const indoorOnly = request.nextUrl.searchParams.get("indoor") !== "0";

  let weather:
    | {
        avgTempC: number | null;
        avgHumidity: number | null;
        rainNext3DaysMm: number;
        hotClimate: boolean;
        city?: string;
        summary?: string;
      }
    | undefined;

  const user = await getSessionUser();
  if (user) {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { city: true, country: true },
    });
    if (profile?.city && profile?.country) {
      const forecast = await fetchWeatherForLocation(
        profile.city,
        profile.country
      );
      if (forecast) {
        const insight = computeWateringAdjustment(forecast);
        weather = {
          avgTempC: insight.avgTempNext3Days,
          avgHumidity: insight.avgHumidityNext3Days,
          rainNext3DaysMm: insight.rainNext3DaysMm,
          hotClimate: insight.avgTempNext3Days >= 30,
          city: profile.city,
          summary: locale === "fa" ? insight.summaryFa : insight.summaryEn,
        };
      }
    }
  }

  const pool = await prisma.plantCatalog.findMany({
    take: 500,
    where: {
      isApproved: true,
      ...(indoorOnly ? { isIndoor: true } : {}),
    },
    orderBy: { nameEn: "asc" },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameFa: true,
      scientificName: true,
      category: true,
      categoryFa: true,
      sunRequirement: true,
      waterRequirement: true,
      difficulty: true,
      isIndoor: true,
      imageUrl: true,
      toxicity: true,
    },
  });

  const scored = pool
    .map((p) => {
      const { score, reasons } = scorePlantForConditions(p, light, weather);
      return {
        ...p,
        score,
        reasons: reasons.map((r) => reasonLabel(r, locale)),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return NextResponse.json({
    light,
    weather: weather || null,
    plants: scored,
  });
}
