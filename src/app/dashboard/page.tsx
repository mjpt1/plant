"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Leaf,
  Loader2,
  Droplets,
  Camera,
  Calendar,
  BookOpen,
  Plus,
  Sprout,
  Scan,
  MapPin,
  Settings,
  ChevronRight,
  ChevronLeft,
  Bell,
  MessageCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { formatDate, formatDateTime } from "@/utils/dateHelper";
import { getHealthStatusLabel } from "@/lib/healthStatus";
import { cn } from "@/lib/utils";

interface DashboardData {
  profile: {
    name: string;
    username: string;
    country: string | null;
    city: string | null;
    createdAt: string;
  };
  plants: Array<{
    id: string;
    nameEn: string;
    nameFa: string;
    healthStatus: string;
    imageUrl: string | null;
    _count: { careReminders: number };
  }>;
  upcomingReminders: Array<{
    id: string;
    titleEn: string;
    titleFa: string;
    type: string;
    scheduledAt: string;
    plant: { nameEn: string; nameFa: string } | null;
  }>;
  recentScans: Array<{
    id: string;
    plantNameEn: string;
    plantNameFa: string;
    healthStatus: string;
    confidence: number;
    createdAt: string;
    imageUrl: string;
  }>;
  stats: {
    plants: number;
    reminders: number;
    scans: number;
    posts: number;
    questions: number;
  };
}

export default function DashboardPage() {
  const { t, locale, direction } = useLanguage();
  const { formatNumber, formatPercent } = useLocaleFormat();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const Chevron = direction === "rtl" ? ChevronLeft : ChevronRight;

  const fetchDashboard = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (res.status === 401) {
      router.push("/auth");
      return;
    }
    const json = await res.json();
    if (res.ok) setData(json);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    fetchDashboard();
  }, [user, authLoading, fetchDashboard, router]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!data) return null;

  const quickActions = [
    { href: "/scan", icon: Camera, label: t.dashboard.actions.scan, color: "from-emerald-500 to-green-600" },
    { href: "/plants/new", icon: Plus, label: t.dashboard.actions.addPlant, color: "from-teal-500 to-cyan-600" },
    { href: "/catalog", icon: BookOpen, label: t.dashboard.actions.browse, color: "from-lime-500 to-emerald-600" },
    { href: "/calendar", icon: Calendar, label: t.dashboard.actions.calendar, color: "from-green-500 to-teal-600" },
  ];

  const statCards = [
    { label: t.dashboard.stats.plants, value: data.stats.plants, icon: Sprout, href: "/plants" },
    { label: t.dashboard.stats.reminders, value: data.stats.reminders, icon: Bell, href: "/calendar" },
    { label: t.dashboard.stats.scans, value: data.stats.scans, icon: Scan, href: "/scan" },
    { label: t.dashboard.stats.posts, value: data.stats.posts, icon: MessageCircle, href: "/social" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="glass-card p-6 md:p-8 mb-6 bg-gradient-to-br from-emerald-500/10 to-green-600/5 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">
              {t.dashboard.welcome} 👋
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">{data.profile.name}</h1>
            <p className="text-gray-500 text-sm mt-1">@{data.profile.username}</p>
            {data.profile.country && data.profile.city && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {data.profile.city}, {data.profile.country}
              </p>
            )}
          </div>
          <Link href="/settings" className="btn-secondary text-sm self-start">
            <Settings className="w-4 h-4" />
            {t.dashboard.actions.settings}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="glass-card p-4 hover:scale-[1.02] transition-all group"
          >
            <stat.icon className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="font-semibold mb-3">{t.dashboard.quickActions}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "rounded-2xl p-4 text-white bg-gradient-to-br shadow-lg hover:scale-[1.03] transition-all",
              action.color
            )}
          >
            <action.icon className="w-6 h-6 mb-2" />
            <p className="text-sm font-medium">{action.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Plants */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-500" />
              {t.dashboard.myPlants}
            </h2>
            <Link href="/plants" className="text-sm text-emerald-600 hover:underline">
              {t.dashboard.viewAll}
            </Link>
          </div>
          {data.plants.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-500 text-sm">
              <Leaf className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
              {t.dashboard.noPlants}
              <div className="flex gap-2 justify-center mt-4">
                <Link href="/catalog" className="btn-primary text-xs px-3 py-1.5">
                  {t.dashboard.actions.browse}
                </Link>
                <Link href="/scan" className="btn-secondary text-xs px-3 py-1.5">
                  {t.dashboard.actions.scan}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {data.plants.map((plant) => (
                <Link
                  key={plant.id}
                  href={`/plants/${plant.id}`}
                  className="glass-card p-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 overflow-hidden shrink-0">
                    {plant.imageUrl ? (
                      <img src={plant.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {locale === "fa" ? plant.nameFa : plant.nameEn}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] badge mt-0.5",
                        plant.healthStatus === "healthy" && "badge-healthy",
                        plant.healthStatus === "warning" && "badge-warning",
                        plant.healthStatus === "critical" && "badge-critical"
                      )}
                    >
                      {getHealthStatusLabel(plant.healthStatus, t)}
                    </span>
                  </div>
                  <Chevron className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              {t.dashboard.upcomingTasks}
            </h2>
            <Link href="/calendar" className="text-sm text-emerald-600 hover:underline">
              {t.dashboard.viewAll}
            </Link>
          </div>
          {data.upcomingReminders.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-500 text-sm">
              {t.dashboard.noReminders}
            </div>
          ) : (
            <div className="space-y-2">
              {data.upcomingReminders.map((r) => (
                <div key={r.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {locale === "fa" ? r.titleFa : r.titleEn}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(r.scheduledAt, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Scans */}
      {data.recentScans.length > 0 && (
        <section className="mt-8">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-500" />
            {t.dashboard.recentScans}
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.recentScans.map((scan) => (
              <div key={scan.id} className="glass-card overflow-hidden">
                <div className="aspect-square bg-emerald-500/10">
                  <img src={scan.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">
                    {locale === "fa" ? scan.plantNameFa : scan.plantNameEn}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {formatDate(scan.createdAt, locale)} · {formatPercent(scan.confidence)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
