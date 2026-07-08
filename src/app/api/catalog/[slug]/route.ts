import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExpertInsight } from "@/lib/catalog-extra";
import {
  getLocaleFromRequest,
  localizeCatalogPlant,
  localizePlantText,
} from "@/lib/plant-locale";
import type { Locale } from "@/i18n";

function expandGuide(
  short: string | null,
  fallback: string | null,
  locale: Locale,
  templates: { en: (v: string) => string; fa: (v: string) => string }
): string | null {
  if (short && short.length > 20) {
    return localizePlantText(short, locale);
  }
  if (fallback) {
    const template = locale === "fa" ? templates.fa : templates.en;
    return localizePlantText(template(fallback), locale);
  }
  return short ? localizePlantText(short, locale) : null;
}

function parseExtra(rawData: unknown) {
  const extra = {
    faq: [] as { question: string; answer: string }[],
    temperature: null as string | null,
    humidity: null as string | null,
    growthRate: null as string | null,
    pruning: null as string | null,
    expertInsight: getExpertInsight(rawData),
  };

  if (!rawData) return extra;

  try {
    const raw =
      typeof rawData === "string" ? JSON.parse(rawData) : (rawData as Record<string, unknown>);
    extra.faq = (raw.faq as typeof extra.faq) || [];
    const params = raw.parameters as Record<string, { recommended?: string }> | undefined;
    const care = raw.care as Record<string, string> | undefined;
    const growth = raw.growthCharacteristics as Record<string, string> | undefined;
    extra.temperature = params?.temperature?.recommended || care?.temperature || null;
    extra.humidity = params?.humidity?.recommended || care?.humidity || null;
    extra.growthRate = growth?.growthRate || null;
    extra.pruning = care?.pruning || null;
  } catch {
    /* ignore */
  }

  return extra;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const locale = getLocaleFromRequest(request);
    const plant = await prisma.plantCatalog.findUnique({
      where: { slug: params.slug },
    });

    if (!plant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (plant.isUserSubmitted && !plant.isApproved) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const extra = parseExtra(plant.rawData);

    const wateringGuide = expandGuide(
      plant.wateringGuide,
      plant.waterRequirement,
      locale,
      {
        en: (v) =>
          `Water when the top layer of soil feels dry. This plant typically needs ${v} watering — adjust for your climate and pot size.`,
        fa: (v) =>
          `وقتی لایهٔ بالایی خاک خشک شد آبیاری کنید. این گیاه معمولاً به آبیاری ${v} نیاز دارد — با توجه به آب‌وهوا و اندازهٔ گلدان تنظیم کنید.`,
      }
    );
    const lightGuide = expandGuide(
      plant.lightGuide,
      plant.sunRequirement,
      locale,
      {
        en: (v) =>
          `Place in ${v} light. Avoid harsh direct sun unless the species requires it.`,
        fa: (v) =>
          `در نور ${v} قرار دهید. از آفتاب مستقیم شدید پرهیز کنید مگر گونه به آن نیاز داشته باشد.`,
      }
    );
    const soilGuide = expandGuide(
      plant.soilGuide,
      plant.soilType,
      locale,
      {
        en: (v) => `Use ${v}. Ensure the pot has drainage holes.`,
        fa: (v) => `از ${v} استفاده کنید. گلدان باید سوراخ زهکشی داشته باشد.`,
      }
    );

    const localized = localizeCatalogPlant(
      {
        ...plant,
        wateringGuide,
        lightGuide,
        soilGuide,
      },
      locale
    );

    return NextResponse.json({
      plant: {
        ...localized,
        faq: extra.faq.map((item) => ({
          question: localizePlantText(item.question, locale) || item.question,
          answer: localizePlantText(item.answer, locale) || item.answer,
        })),
        temperature: localizePlantText(extra.temperature, locale),
        humidity: localizePlantText(extra.humidity, locale),
        growthRate: localizePlantText(extra.growthRate, locale),
        pruning: localizePlantText(extra.pruning, locale),
        expertInsight: localizePlantText(extra.expertInsight, locale),
      },
    });
  } catch (error) {
    console.error("GET catalog detail error:", error);
    return NextResponse.json({ error: "Failed to fetch plant" }, { status: 404 });
  }
}
