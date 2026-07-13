"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Droplets,
  Leaf,
  Scissors,
  Flower2,
  RefreshCw,
  Calendar,
  Trash2,
  MapPin,
  Pencil,
  Check,
  Scan,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { formatDateTime } from "@/utils/dateHelper";
import { cn } from "@/lib/utils";
import { getHealthStatusLabel } from "@/lib/healthStatus";
import { toast } from "sonner";
import { ScanThumbnail } from "@/components/scan/ScanThumbnail";
import type { CarePlanTaskView, CareReminderItem } from "@/types";
import { Button } from "@/components/ui/button";
import { PlantJournalPanel } from "@/components/plants/PlantJournalPanel";

interface ScanHistoryItem {
  id: string;
  imageUrl: string;
  plantNameEn: string;
  plantNameFa: string;
  healthStatus: string;
  confidence: number;
  createdAt: string;
}

interface PlantDetail {
  id: string;
  nameEn: string;
  nameFa: string;
  scientificName: string | null;
  imageUrl: string | null;
  healthStatus: string;
  environment: string;
  notes: string | null;
  lastWateredAt: string | null;
  lastFertilizedAt: string | null;
  carePlan: {
    tasks: CarePlanTaskView[];
    climate: {
      labelEn: string;
      labelFa: string;
      weather?: {
        locationName: string;
        summaryEn: string;
        summaryFa: string;
        avgTempNext3Days: number;
        rainNext3DaysMm: number;
        avgHumidityNext3Days: number;
      };
    };
  } | null;
  careReminders: CareReminderItem[];
  scanHistory: ScanHistoryItem[];
}

const TYPE_ICONS: Record<string, typeof Droplets> = {
  watering: Droplets,
  fertilizing: Leaf,
  pruning: Scissors,
  repotting: Flower2,
  inspection: Leaf,
  custom: Flower2,
};

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLanguage();
  const { formatPercent } = useLocaleFormat();
  const { user } = useAuth();
  const [plant, setPlant] = useState<PlantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    nameEn: "",
    nameFa: "",
    scientificName: "",
    environment: "indoor",
    healthStatus: "healthy",
    notes: "",
  });

  const fetchPlant = useCallback(async () => {
    const res = await fetch(`/api/plants/${id}`);
    const data = await res.json();
    if (res.ok) {
      setPlant(data.plant);
      setEditForm({
        nameEn: data.plant.nameEn,
        nameFa: data.plant.nameFa,
        scientificName: data.plant.scientificName || "",
        environment: data.plant.environment,
        healthStatus: data.plant.healthStatus,
        notes: data.plant.notes || "",
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (user && id) fetchPlant();
    else if (!user) setLoading(false);
  }, [user, id, fetchPlant]);

  const regenerate = async () => {
    setRegenerating(true);
    await fetch(`/api/plants/${id}/schedule`, { method: "POST" });
    await fetchPlant();
    setRegenerating(false);
    toast.success(t.plants.regeneratePlan);
  };

  const saveEdit = async () => {
    setSaving(true);
    const res = await fetch(`/api/plants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    if (res.ok) {
      await fetchPlant();
      setEditing(false);
      toast.success(t.plants.saveChanges);
    } else {
      toast.error(t.common.error);
    }
  };

  const markReminderDone = async (reminderId: string) => {
    const res = await fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reminderId, completed: true }),
    });
    if (res.ok) {
      await fetchPlant();
      toast.success(t.calendar.markDone);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t.plants.deleteConfirm)) return;
    await fetch(`/api/plants/${id}`, { method: "DELETE" });
    window.location.href = "/plants";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user || !plant) {
    return (
      <div className="text-center py-16">
        <Link href="/plants" className="btn-secondary">{t.common.back}</Link>
      </div>
    );
  }

  const tasks = plant.carePlan?.tasks || [];
  const climate = plant.carePlan?.climate;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <Link
        href="/plants"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.common.back}
      </Link>

      <div className="glass-card overflow-hidden mb-6">
        {plant.imageUrl && (
          <img
            src={plant.imageUrl}
            alt={locale === "fa" ? plant.nameFa : plant.nameEn}
            className="w-full max-h-64 object-cover"
          />
        )}
        <div className="p-5 sm:p-6">
          {!editing ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    {locale === "fa" ? plant.nameFa : plant.nameEn}
                  </h1>
                  <p className="text-muted-foreground italic">{plant.scientificName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "badge",
                      plant.healthStatus === "healthy" && "badge-healthy",
                      plant.healthStatus === "warning" && "badge-warning",
                      plant.healthStatus === "critical" && "badge-critical"
                    )}
                  >
                    {getHealthStatusLabel(plant.healthStatus, t)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t.plants.environments[
                  plant.environment as keyof typeof t.plants.environments
                ] || plant.environment}
              </p>
              {plant.lastWateredAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t.plants.lastWatered}: {formatDateTime(plant.lastWateredAt, locale)}
                </p>
              )}
              {plant.notes && (
                <p className="text-sm mt-3">{plant.notes}</p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <input
                value={editForm.nameEn}
                onChange={(e) => setEditForm((f) => ({ ...f, nameEn: e.target.value }))}
                className="input-field"
                placeholder={t.plants.nameEn}
              />
              <input
                value={editForm.nameFa}
                onChange={(e) => setEditForm((f) => ({ ...f, nameFa: e.target.value }))}
                className="input-field"
                placeholder={t.plants.nameFa}
              />
              <input
                value={editForm.scientificName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, scientificName: e.target.value }))
                }
                className="input-field"
                placeholder={t.plants.scientificName}
              />
              <select
                value={editForm.environment}
                onChange={(e) => setEditForm((f) => ({ ...f, environment: e.target.value }))}
                className="input-field"
              >
                {Object.entries(t.plants.environments).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={editForm.healthStatus}
                onChange={(e) => setEditForm((f) => ({ ...f, healthStatus: e.target.value }))}
                className="input-field"
              >
                <option value="healthy">{t.scan.results.healthy}</option>
                <option value="warning">{t.scan.results.warning}</option>
                <option value="critical">{t.scan.results.critical}</option>
              </select>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                className="input-field resize-none"
                rows={3}
                placeholder={t.plants.notes}
              />
              <div className="flex gap-2">
                <Button onClick={saveEdit} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.plants.saveChanges}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {climate && (
        <div className="glass-card p-4 mb-6 flex items-start gap-3">
          <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">{t.plants.climateNote}</p>
              <p className="text-sm font-medium">
                {locale === "fa" ? climate.labelFa : climate.labelEn}
              </p>
            </div>
            {climate.weather && (
              <div className="text-xs text-muted-foreground border-t border-border/50 pt-2">
                <p className="font-medium text-foreground mb-1">
                  {t.plants.weatherForecast}
                </p>
                <p>
                  {locale === "fa"
                    ? climate.weather.summaryFa
                    : climate.weather.summaryEn}
                </p>
                <p className="mt-1">
                  {climate.weather.locationName} · {climate.weather.avgTempNext3Days}° ·{" "}
                  {climate.weather.rainNext3DaysMm} mm
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t.plants.carePlan}</h2>
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="btn-secondary text-sm px-3 py-1.5"
        >
          {regenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {t.plants.regeneratePlan}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="glass-card p-6 text-center text-muted-foreground mb-6">
          <p className="mb-3">{t.plants.locationRequired}</p>
          <Link href="/settings" className="btn-primary text-sm">
            {t.plants.goToProfile}
          </Link>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {tasks.map((task) => {
            const Icon = TYPE_ICONS[task.type] || Leaf;
            return (
              <div key={task.type} className="glass-card p-4 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">
                    {locale === "fa" ? task.titleFa : task.titleEn}
                  </h3>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {t.calendar.types[task.type as keyof typeof t.calendar.types] || task.type}
                    {" · "}
                    {locale === "fa"
                      ? `هر ${task.intervalDays} روز`
                      : `Every ${task.intervalDays} days`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {locale === "fa" ? task.notesFa : task.notesEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-emerald-500" />
        {t.plants.nextTasks}
      </h2>
      <div className="space-y-2 mb-8">
        {plant.careReminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.calendar.noReminders}</p>
        ) : (
          plant.careReminders.map((r) => {
            const Icon = TYPE_ICONS[r.type] || Leaf;
            return (
              <div key={r.id} className="glass p-3 rounded-xl flex items-center gap-3">
                <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {locale === "fa" ? r.titleFa : r.titleEn}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(r.scheduledAt, locale)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => markReminderDone(r.id)}
                  className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-600"
                  title={t.calendar.markDone}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
        <Link href="/calendar" className="text-sm text-emerald-600 hover:underline block mt-2">
          {t.nav.calendar} →
        </Link>
      </div>

      <PlantJournalPanel plantId={plant.id} />

      {plant.scanHistory.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Scan className="w-5 h-5 text-emerald-500" />
            {t.plants.scanHistory}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {plant.scanHistory.map((scan) => (
              <div key={scan.id} className="glass-card overflow-hidden rounded-xl">
                <ScanThumbnail
                  src={scan.imageUrl}
                  className="aspect-square object-cover w-full"
                />
                <div className="p-2">
                  <p className="text-xs font-medium truncate">
                    {locale === "fa" ? scan.plantNameFa : scan.plantNameEn}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatPercent(scan.confidence)} ·{" "}
                    {formatDateTime(scan.createdAt, locale)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={handleDelete}
        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400"
      >
        <Trash2 className="w-4 h-4" />
        {t.common.delete}
      </button>
    </div>
  );
}
