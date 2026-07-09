export type DailyWeather = {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  humidity: number;
};

export type WeatherForecast = {
  locationName: string;
  latitude: number;
  longitude: number;
  daily: DailyWeather[];
  fetchedAt: Date;
};

export type WateringWeatherInsight = {
  adjustment: number;
  summaryEn: string;
  summaryFa: string;
  avgTempNext3Days: number;
  rainNext3DaysMm: number;
  avgHumidityNext3Days: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { forecast: WeatherForecast; expiresAt: number }>();

const COUNTRY_CODES: Record<string, string> = {
  iran: "IR",
  ایران: "IR",
  germany: "DE",
  deutschland: "DE",
  france: "FR",
  uk: "GB",
  britain: "GB",
  "united kingdom": "GB",
  usa: "US",
  "united states": "US",
  canada: "CA",
  turkey: "TR",
  ترکیه: "TR",
  uae: "AE",
  emirates: "AE",
  "united arab emirates": "AE",
  saudi: "SA",
  iraq: "IQ",
  عراق: "IQ",
  india: "IN",
  australia: "AU",
};

function cacheKey(city: string, country: string): string {
  return `${city.trim().toLowerCase()}|${country.trim().toLowerCase()}`;
}

function resolveCountryCode(country: string): string | undefined {
  const key = country.trim().toLowerCase();
  if (COUNTRY_CODES[key]) return COUNTRY_CODES[key];
  const hit = Object.entries(COUNTRY_CODES).find(([name]) => key.includes(name));
  return hit?.[1];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function computeWateringAdjustment(
  forecast: WeatherForecast
): WateringWeatherInsight {
  const next3 = forecast.daily.slice(0, 3);
  const avgTemp = average(next3.map((d) => d.tempMax));
  const rainMm = next3.reduce((sum, d) => sum + d.precipitation, 0);
  const avgHumidity = average(next3.map((d) => d.humidity));

  let adjustment = 1;

  if (avgTemp >= 35) adjustment += 0.35;
  else if (avgTemp >= 30) adjustment += 0.22;
  else if (avgTemp >= 25) adjustment += 0.1;
  else if (avgTemp <= 8) adjustment -= 0.25;
  else if (avgTemp <= 15) adjustment -= 0.1;

  if (rainMm >= 20) adjustment -= 0.4;
  else if (rainMm >= 10) adjustment -= 0.25;
  else if (rainMm >= 4) adjustment -= 0.12;

  if (avgHumidity < 30 && avgTemp >= 24) adjustment += 0.12;
  if (avgHumidity > 75 && avgTemp >= 20) adjustment -= 0.08;

  adjustment = Math.min(1.8, Math.max(0.55, adjustment));

  let summaryEn = `Live forecast for ${forecast.locationName}: `;
  let summaryFa = `پیش‌بینی زنده برای ${forecast.locationName}: `;

  if (rainMm >= 8) {
    summaryEn += "rain expected — watering spaced out.";
    summaryFa += "بارش پیش‌بینی می‌شود — آبیاری با فاصله بیشتر.";
  } else if (avgTemp >= 30) {
    summaryEn += "hot and dry — more frequent watering.";
    summaryFa += "گرم و خشک — آبیاری بیشتر.";
  } else if (avgTemp <= 12) {
    summaryEn += "cool weather — slower watering schedule.";
    summaryFa += "هوای سرد — آبیاری با فاصله بیشتر.";
  } else {
    summaryEn += "moderate conditions — standard adjusted schedule.";
    summaryFa += "شرایط معتدل — برنامه تنظیم‌شده.";
  }

  return {
    adjustment,
    summaryEn,
    summaryFa,
    avgTempNext3Days: Math.round(avgTemp),
    rainNext3DaysMm: Math.round(rainMm * 10) / 10,
    avgHumidityNext3Days: Math.round(avgHumidity),
  };
}

export function isRainyDay(date: Date, forecast?: WeatherForecast | null): boolean {
  if (!forecast) return false;
  const key = date.toISOString().slice(0, 10);
  const day = forecast.daily.find((d) => d.date === key);
  return (day?.precipitation ?? 0) >= 8;
}

export function shiftPastRain(
  date: Date,
  forecast?: WeatherForecast | null,
  maxShiftDays = 7
): Date {
  const shifted = new Date(date);
  let moves = 0;
  while (isRainyDay(shifted, forecast) && moves < maxShiftDays) {
    shifted.setDate(shifted.getDate() + 1);
    moves++;
  }
  return shifted;
}

async function geocodeCity(
  city: string,
  country: string
): Promise<{ name: string; latitude: number; longitude: number } | null> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city.trim());
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const countryCode = resolveCountryCode(country);
  if (countryCode) url.searchParams.set("country_code", countryCode);

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      admin1?: string;
    }>;
  };

  const results = data.results || [];
  if (results.length === 0) return null;

  const countryLower = country.trim().toLowerCase();
  const preferred =
    results.find((r) =>
      r.country?.toLowerCase().includes(countryLower.slice(0, 3))
    ) || results[0];

  return {
    name: preferred.admin1
      ? `${preferred.name}, ${preferred.admin1}`
      : preferred.name,
    latitude: preferred.latitude,
    longitude: preferred.longitude,
  };
}

async function fetchForecast(
  latitude: number,
  longitude: number,
  locationName: string
): Promise<WeatherForecast | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean"
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "14");

  const response = await fetch(url.toString(), {
    next: { revalidate: 1800 },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
      relative_humidity_2m_mean?: number[];
    };
  };

  const daily = data.daily;
  if (!daily?.time?.length) return null;

  const days: DailyWeather[] = daily.time.map((date, index) => ({
    date,
    tempMax: daily.temperature_2m_max?.[index] ?? 0,
    tempMin: daily.temperature_2m_min?.[index] ?? 0,
    precipitation: daily.precipitation_sum?.[index] ?? 0,
    humidity: daily.relative_humidity_2m_mean?.[index] ?? 0,
  }));

  return {
    locationName,
    latitude,
    longitude,
    daily: days,
    fetchedAt: new Date(),
  };
}

export async function fetchWeatherForLocation(
  city: string,
  country: string
): Promise<WeatherForecast | null> {
  const trimmedCity = city?.trim();
  const trimmedCountry = country?.trim();
  if (!trimmedCity || !trimmedCountry) return null;

  const key = cacheKey(trimmedCity, trimmedCountry);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.forecast;
  }

  try {
    const geo = await geocodeCity(trimmedCity, trimmedCountry);
    if (!geo) return null;

    const forecast = await fetchForecast(
      geo.latitude,
      geo.longitude,
      geo.name
    );
    if (!forecast) return null;

    cache.set(key, {
      forecast,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return forecast;
  } catch {
    return null;
  }
}
