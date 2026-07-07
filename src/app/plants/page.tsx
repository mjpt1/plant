"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Leaf,
  Loader2,
  MapPin,
  Droplets,
  ChevronRight,
  ChevronLeft,
  Camera,
  Search,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { cn } from "@/lib/utils";
import { getHealthStatusLabel } from "@/lib/healthStatus";
import type { PlantProfile } from "@/types";

export default function PlantsPage() {
  const { t, locale, direction } = useLanguage();
  const { formatNumber } = useLocaleFormat();
  const { user, loading: authLoading } = useAuth();
  const [plants, setPlants] = useState<PlantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const Chevron = direction === "rtl" ? ChevronLeft : ChevronRight;

  const fetchPlants = useCallback(async () => {
    try {
      const res = await fetch("/api/plants");
      const data = await res.json();
      setPlants(data.plants || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchPlants();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading, fetchPlants]);

  const filtered = plants.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.nameEn.toLowerCase().includes(q) ||
      p.nameFa.includes(search) ||
      (p.scientificName?.toLowerCase().includes(q) ?? false)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Leaf className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">{t.plants.title}</h1>
        <p className="text-muted-foreground mb-6">{t.plants.subtitle}</p>
        <Link href="/auth/login" className="btn-primary">
          {t.nav.login}
        </Link>
      </div>
    );
  }

  const needsLocation = !user.country || !user.city;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t.plants.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.plants.subtitle}</p>
        </div>
        <Link href="/plants/new" className="btn-primary text-sm px-4 py-2 self-start">
          <Plus className="w-4 h-4" />
          {t.plants.addPlant}
        </Link>
      </div>

      {plants.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.catalog.search}
            className="input-field ps-10"
          />
        </div>
      )}

      {needsLocation && (
        <div className="glass-card p-5 mb-6 border border-amber-500/30 animate-fade-in">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm mb-2">{t.plants.locationRequired}</p>
              <Link href="/settings" className="text-sm text-emerald-600 font-medium">
                {t.plants.goToProfile} →
              </Link>
            </div>
          </div>
        </div>
      )}

      {plants.length === 0 ? (
        <div className="glass-card p-10 sm:p-12 text-center animate-fade-in">
          <Leaf className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">{t.plants.noPlants}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/scan" className="btn-primary">
              <Camera className="w-4 h-4" />
              {t.plants.scanToAdd}
            </Link>
            <Link href="/catalog" className="btn-secondary">
              {t.catalog.title}
            </Link>
            <Link href="/plants/new" className="btn-secondary">
              <Plus className="w-4 h-4" />
              {t.plants.addPlant}
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          {t.catalog.noResults}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((plant) => (
            <Link
              key={plant.id}
              href={`/plants/${plant.id}`}
              className="glass-card overflow-hidden hover:scale-[1.02] transition-all group"
            >
              <div className="aspect-video bg-emerald-500/10 relative">
                {plant.imageUrl ? (
                  <img
                    src={plant.imageUrl}
                    alt={locale === "fa" ? plant.nameFa : plant.nameEn}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Leaf className="w-12 h-12 text-emerald-300" />
                  </div>
                )}
                <span
                  className={cn(
                    "absolute top-3 end-3 badge",
                    plant.healthStatus === "healthy" && "badge-healthy",
                    plant.healthStatus === "warning" && "badge-warning",
                    plant.healthStatus === "critical" && "badge-critical"
                  )}
                >
                  {getHealthStatusLabel(plant.healthStatus, t)}
                </span>
              </div>
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">
                    {locale === "fa" ? plant.nameFa : plant.nameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground italic truncate">
                    {plant.scientificName}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <Droplets className="w-3 h-3 shrink-0" />
                    {formatNumber(plant._count?.careReminders ?? 0)} {t.plants.pendingTasks}
                  </p>
                </div>
                <Chevron className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
