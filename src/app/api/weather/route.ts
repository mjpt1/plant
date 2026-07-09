import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import {
  computeWateringAdjustment,
  fetchWeatherForLocation,
} from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { city: true, country: true },
    });

    if (!profile?.city?.trim() || !profile?.country?.trim()) {
      return NextResponse.json(
        { error: "Location not set", code: "LOCATION_REQUIRED" },
        { status: 400 }
      );
    }

    const forecast = await fetchWeatherForLocation(
      profile.city,
      profile.country
    );

    if (!forecast) {
      return NextResponse.json(
        { error: "Weather unavailable for this city", code: "WEATHER_UNAVAILABLE" },
        { status: 404 }
      );
    }

    const insight = computeWateringAdjustment(forecast);

    return NextResponse.json({
      location: {
        city: profile.city,
        country: profile.country,
        name: forecast.locationName,
      },
      forecast: {
        fetchedAt: forecast.fetchedAt.toISOString(),
        daily: forecast.daily.slice(0, 7),
      },
      insight,
    });
  } catch (error) {
    return apiError(error);
  }
}
