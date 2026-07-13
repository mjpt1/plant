"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  Leaf,
  Droplets,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Plus,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { localizePlantName, localizeCategory, localizeEnumValue } from "@/lib/plant-locale";
import { cn } from "@/lib/utils";

interface CatalogPlant {
  id: string;
  slug: string;
  nameEn: string;
  nameFa: string;
  scientificName: string | null;
  category: string;
  categoryFa: string;
  waterRequirement: string | null;
  sunRequirement: string | null;
  difficulty: string | null;
  isIndoor: boolean;
  imageUrl: string | null;
  source: string;
  toxicity: string | null;
}

interface CategoryCount {
  category: string;
  categoryFa: string;
  count: number;
}

export default function CatalogPage() {
  const { t, locale, direction } = useLanguage();
  const { formatNumber } = useLocaleFormat();
  const { user } = useAuth();
  const [plants, setPlants] = useState<CatalogPlant[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const Chevron = direction === "rtl" ? ChevronLeft : ChevronRight;

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category !== "all") params.set("category", category);
      if (indoorOnly) params.set("indoor", "true");
      params.set("page", String(page));
      const res = await fetch(`/api/catalog?${params}`);
      const data = await res.json();
      setPlants(data.plants || []);
      setCategories(data.categories || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [search, category, indoorOnly, page]);

  useEffect(() => {
    const timer = setTimeout(fetchCatalog, 300);
    return () => clearTimeout(timer);
  }, [fetchCatalog]);

  useEffect(() => {
    setPage(1);
  }, [search, category, indoorOnly]);

  const displayCategories = categories.slice(0, 12);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-emerald-500" />
              <h1 className="text-3xl font-bold">{t.catalog.title}</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{t.catalog.subtitle}</p>
            <p className="text-sm text-emerald-600 mt-1">
              {formatNumber(total)} {t.catalog.plantsCount}
            </p>
          </div>
          {user && (
            <Link href="/catalog/add" className="btn-primary self-start">
              <Plus className="w-5 h-5" />
              {t.catalog.addNew}
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.catalog.search}
            className="input-field ps-10"
          />
        </div>
        <label className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={indoorOnly}
            onChange={(e) => setIndoorOnly(e.target.checked)}
            className="accent-emerald-500"
          />
          {t.catalog.indoorOnly}
        </label>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-6">
        <button
          onClick={() => setCategory("all")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap",
            category === "all" ? "bg-emerald-500 text-white" : "glass"
          )}
        >
          {t.catalog.allCategories}
        </button>
        {displayCategories.map((c) => (
          <button
            key={c.category}
            onClick={() => setCategory(c.category)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap",
              category === c.category ? "bg-emerald-500 text-white" : "glass"
            )}
          >
            {localizeCategory(c.category, c.categoryFa, locale)} ({c.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : plants.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-500">
          {t.catalog.noResults}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plants.map((plant) => (
              <Link
                key={plant.id}
                href={`/catalog/${plant.slug}`}
                className="glass-card overflow-hidden hover:scale-[1.02] transition-all group"
              >
                <div className="aspect-[4/3] bg-emerald-500/10 relative">
                  {plant.imageUrl ? (
                    <img
                      src={plant.imageUrl}
                      alt={localizePlantName(plant, locale)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="w-12 h-12 text-emerald-300" />
                    </div>
                  )}
                  {plant.isIndoor && (
                    <span className="absolute top-2 right-2 badge-healthy text-[10px]">
                      {t.catalog.indoor}
                    </span>
                  )}
                  {plant.toxicity &&
                    !/non[- ]?toxic|غیرسمی|بی‌خطر/i.test(plant.toxicity) && (
                      <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/90 text-white">
                        {t.catalog.toxicity}
                      </span>
                    )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm">
                    {localizePlantName(plant, locale)}
                  </h3>
                  <p className="text-xs text-gray-500 italic truncate">
                    {plant.scientificName}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {plant.waterRequirement && (
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3" />
                        {localizeEnumValue(plant.waterRequirement, locale, {
                          low: "کم",
                          medium: "متوسط",
                          high: "زیاد",
                          moist: "مرطوب",
                          dry: "خشک",
                        }) || plant.waterRequirement}
                      </span>
                    )}
                    {plant.difficulty && (
                      <span>
                        {localizeEnumValue(plant.difficulty, locale, {
                          easy: "آسان",
                          moderate: "متوسط",
                          medium: "متوسط",
                          difficult: "سخت",
                          hard: "سخت",
                          beginner: "مبتدی",
                        }) || plant.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t.catalog.viewDetails}
                    <Chevron className="w-3 h-3" />
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
              >
                {t.common.previous}
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
              >
                {t.common.next}
              </button>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-gray-400 text-center mt-8">{t.catalog.sources}</p>
    </div>
  );
}
