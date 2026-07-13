"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Leaf, Loader2, Sparkles, Sun } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { localizePlantName } from "@/lib/plant-locale";
import type { LightBand } from "@/lib/plant-recommend";

type PlantRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameFa: string;
  scientificName: string | null;
  category: string;
  categoryFa: string;
  imageUrl: string | null;
  score: number;
  reasons: string[];
  toxicity: string | null;
};

const BANDS: LightBand[] = ["dark", "low", "medium", "bright", "direct"];

export default function RecommendClient() {
  const { locale } = useLanguage();
  const fa = locale === "fa";
  const params = useSearchParams();
  const initial = (params.get("light") as LightBand) || "medium";
  const [light, setLight] = useState<LightBand>(
    BANDS.includes(initial) ? initial : "medium"
  );
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [weatherSummary, setWeatherSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/recommend?light=${light}&locale=${locale}`
      );
      const data = await res.json();
      setPlants(data.plants || []);
      setWeatherSummary(data.weather?.summary || null);
    } catch {
      setPlants([]);
    } finally {
      setLoading(false);
    }
  }, [light, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const bandLabels: Record<LightBand, string> = fa
    ? {
        dark: "خیلی تاریک",
        low: "نور کم",
        medium: "متوسط",
        bright: "روشن",
        direct: "آفتاب مستقیم",
      }
    : {
        dark: "Dark",
        low: "Low",
        medium: "Medium",
        bright: "Bright",
        direct: "Direct sun",
      };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          {fa ? "پیشنهاد گیاه" : "Plant recommendations"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {fa
            ? "بر اساس نور محل و آب‌وهوای شهر شما، گیاهان مناسب پیشنهاد می‌شوند."
            : "Suggestions based on your light level and local weather."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {BANDS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setLight(b)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              light === b
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border"
            }`}
          >
            <Sun className="w-3.5 h-3.5 inline me-1" />
            {bandLabels[b]}
          </button>
        ))}
      </div>

      {weatherSummary && (
        <p className="text-sm glass-card p-3">{weatherSummary}</p>
      )}

      <div className="flex gap-2 text-sm">
        <Link href="/light-meter" className="btn-secondary">
          {fa ? "اندازه‌گیری نور" : "Measure light"}
        </Link>
        <Link href="/assistant" className="btn-secondary">
          {fa ? "پرسش از دستیار" : "Ask assistant"}
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : plants.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          {fa ? "نتیجه‌ای پیدا نشد." : "No matches found."}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {plants.map((p) => (
            <Link
              key={p.id}
              href={`/catalog/${p.slug}`}
              className="glass-card p-3 hover:scale-[1.01] transition-transform"
            >
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-emerald-500/10 overflow-hidden shrink-0">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center">
                      <Leaf className="w-6 h-6 text-emerald-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {localizePlantName(p, locale)}
                  </p>
                  <p className="text-[11px] text-muted-foreground italic truncate">
                    {p.scientificName}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {fa ? "امتیاز تناسب" : "Fit score"}: {p.score}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {p.reasons.slice(0, 3).map((r) => (
                      <li key={r} className="text-[11px] text-muted-foreground">
                        · {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
