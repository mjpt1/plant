"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Droplets,
  Sun,
  Leaf,
  Shovel,
  Thermometer,
  TrendingUp,
  Scissors,
  Lightbulb,
  AlertTriangle,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface CatalogDetail {
  id: string;
  slug: string;
  nameEn: string;
  nameFa: string;
  scientificName: string | null;
  category: string;
  categoryFa: string;
  description: string | null;
  sunRequirement: string | null;
  waterRequirement: string | null;
  soilType: string | null;
  soilPh: string | null;
  difficulty: string | null;
  wateringGuide: string | null;
  lightGuide: string | null;
  fertilizerGuide: string | null;
  soilGuide: string | null;
  toxicity: string | null;
  isIndoor: boolean;
  imageUrl: string | null;
  source: string;
  isUserSubmitted?: boolean;
  faq: { question: string; answer: string }[];
  temperature?: string | null;
  humidity?: string | null;
  growthRate?: string | null;
  pruning?: string | null;
  expertInsight?: string | null;
}

export default function CatalogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [plant, setPlant] = useState<CatalogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [adopting, setAdopting] = useState(false);
  const [adopted, setAdopted] = useState(false);

  const fetchPlant = useCallback(async () => {
    const res = await fetch(`/api/catalog/${slug}`);
    const data = await res.json();
    if (res.ok) setPlant(data.plant);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchPlant();
  }, [fetchPlant]);

  const handleAdopt = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    setAdopting(true);
    const res = await fetch(`/api/catalog/${slug}/adopt`, { method: "POST" });
    const data = await res.json();
    setAdopting(false);
    if (res.ok) {
      setAdopted(true);
      if (!data.scheduleGenerated) {
        toast.info(t.plants.locationRequired);
      }
      setTimeout(() => router.push(`/plants/${data.plant.id}`), 1500);
    } else {
      toast.error(data.error || t.common.error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="text-center py-16">
        <Link href="/catalog" className="btn-secondary">{t.common.back}</Link>
      </div>
    );
  }

  const careItems = [
    { icon: Droplets, label: t.scan.results.watering, value: plant.wateringGuide },
    { icon: Sun, label: t.scan.results.light, value: plant.lightGuide || plant.sunRequirement },
    { icon: Leaf, label: t.scan.results.fertilizer, value: plant.fertilizerGuide },
    { icon: Shovel, label: t.scan.results.soilType, value: plant.soilGuide || plant.soilType },
  ];

  const extraItems = [
    { icon: Thermometer, label: t.catalog.temperature, value: plant.temperature },
    { icon: Droplets, label: t.catalog.humidity, value: plant.humidity },
    { icon: TrendingUp, label: t.catalog.growthRate, value: plant.growthRate },
    { icon: Scissors, label: t.catalog.pruning, value: plant.pruning },
  ].filter((i) => i.value);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.catalog.backToCatalog}
      </Link>

      <div className="glass-card overflow-hidden mb-6">
        {plant.imageUrl && (
          <img
            src={plant.imageUrl}
            alt={locale === "fa" ? plant.nameFa : plant.nameEn}
            className="w-full max-h-72 object-cover"
          />
        )}
        <div className="p-6">
          <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs mb-2">
            {locale === "fa" ? plant.categoryFa : plant.category}
          </span>
          {plant.isUserSubmitted && (
            <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs mb-2 ms-2">
              {t.catalog.userSubmitted}
            </span>
          )}
          <h1 className="text-2xl font-bold">
            {locale === "fa" ? plant.nameFa : plant.nameEn}
          </h1>
          <p className="text-gray-500 italic">{plant.scientificName}</p>
          {plant.difficulty && (
            <p className="text-sm text-gray-500 mt-1">
              {t.catalog.difficulty}: {plant.difficulty}
            </p>
          )}
          {plant.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
              {plant.description}
            </p>
          )}
        </div>
      </div>

      {plant.expertInsight && (
        <div className="glass-card p-4 mb-6 flex items-start gap-3 border border-emerald-500/20">
          <Lightbulb className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-300">{plant.expertInsight}</p>
        </div>
      )}

      <h2 className="font-semibold mb-3">{t.catalog.completeProfile}</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {careItems.map(
          (item) =>
            item.value && (
              <div key={item.label} className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.value}</p>
              </div>
            )
        )}
      </div>

      {extraItems.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {extraItems.map((item) => (
            <div key={item.label} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="w-4 h-4 text-teal-500" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {plant.toxicity && (
        <div className="glass-card p-4 mb-6 flex items-start gap-3 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">{t.catalog.toxicity}</p>
            <p className="text-xs text-gray-500 mt-1">{plant.toxicity}</p>
          </div>
        </div>
      )}

      {plant.faq.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-3">{t.catalog.faq}</h2>
          <div className="space-y-2">
            {plant.faq.slice(0, 5).map((f, i) => (
              <div key={i} className="glass-card p-4">
                <p className="text-sm font-medium">{f.question}</p>
                <p className="text-xs text-gray-500 mt-1">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {adopted ? (
          <div className="flex items-center gap-2 text-emerald-600 btn-primary w-full sm:w-auto justify-center">
            <CheckCircle2 className="w-5 h-5" />
            {t.catalog.added}
          </div>
        ) : (
          <button
            onClick={handleAdopt}
            disabled={adopting}
            className="btn-primary w-full sm:w-auto"
          >
            {adopting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {t.catalog.addToMyPlants}
          </button>
        )}
      </div>
    </div>
  );
}
