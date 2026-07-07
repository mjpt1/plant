import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExpertInsight } from "@/lib/catalog-extra";

function expandGuide(
  short: string | null,
  fallback: string | null,
  template: (v: string) => string
): string | null {
  if (short && short.length > 20) return short;
  if (fallback) return template(fallback);
  return short;
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
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
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
      (v) =>
        `Water when the top layer of soil feels dry. This plant typically needs ${v} watering — adjust for your climate and pot size.`
    );
    const lightGuide = expandGuide(
      plant.lightGuide,
      plant.sunRequirement,
      (v) =>
        `Place in ${v} light. Avoid harsh direct sun unless the species requires it.`
    );
    const soilGuide = expandGuide(
      plant.soilGuide,
      plant.soilType,
      (v) => `Use ${v}. Ensure the pot has drainage holes.`
    );

    return NextResponse.json({
      plant: {
        ...plant,
        wateringGuide,
        lightGuide,
        soilGuide,
        faq: extra.faq,
        temperature: extra.temperature,
        humidity: extra.humidity,
        growthRate: extra.growthRate,
        pruning: extra.pruning,
        expertInsight: extra.expertInsight,
      },
    });
  } catch (error) {
    console.error("GET catalog detail error:", error);
    return NextResponse.json({ error: "Failed to fetch plant" }, { status: 404 });
  }
}
