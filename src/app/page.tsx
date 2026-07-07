"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Camera,
  Users,
  Sparkles,
  Shield,
  Heart,
  Calendar,
  MessageCircleQuestion,
  LayoutDashboard,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";

const features = [
  {
    icon: Sparkles,
    key: "identify" as const,
    descKey: "identifyDesc" as const,
    href: "/scan",
    gradient: "from-emerald-400 to-green-600",
  },
  {
    icon: Shield,
    key: "diagnose" as const,
    descKey: "diagnoseDesc" as const,
    href: "/scan",
    gradient: "from-teal-400 to-cyan-600",
  },
  {
    icon: Heart,
    key: "community" as const,
    descKey: "communityDesc" as const,
    href: "/social",
    gradient: "from-lime-400 to-emerald-600",
  },
  {
    icon: Calendar,
    key: "calendar" as const,
    descKey: "calendarDesc" as const,
    href: "/calendar",
    gradient: "from-green-400 to-teal-600",
  },
];

export default function HomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { formatCompactNumber } = useLocaleFormat();
  const [stats, setStats] = useState({ scans: 0, users: 0, questions: 0, plants: 0 });

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setStats(d.stats);
      })
      .catch(() => {});
  }, []);

  const fmt = (n: number) => formatCompactNumber(n);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-400/15 rounded-full blur-3xl" />
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-emerald-600 dark:text-emerald-400 mb-6">
            <Sparkles className="w-4 h-4" />
            {t.app.tagline}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6 bg-gradient-to-r from-emerald-700 via-green-600 to-teal-500 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 bg-clip-text text-transparent">
            {t.home.heroTitle}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-balance">
            {t.home.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link href="/dashboard" className="btn-primary w-full sm:w-auto">
                <LayoutDashboard className="w-5 h-5" />
                {t.dashboard.goToDashboard}
              </Link>
            ) : (
              <Link href="/auth/login" className="btn-primary w-full sm:w-auto">
                {t.nav.login}
              </Link>
            )}
            <Link href="/scan" className="btn-secondary w-full sm:w-auto">
              <Camera className="w-5 h-5" />
              {t.home.scanNow}
            </Link>
            <Link href="/social" className="btn-secondary w-full sm:w-auto hidden sm:inline-flex">
              <Users className="w-5 h-5" />
              {t.home.exploreSocial}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-16 animate-fade-in-delay-1">
          {[
            { value: fmt(stats.plants), label: t.home.stats.plants },
            { value: fmt(stats.users), label: t.home.stats.users },
            { value: fmt(stats.scans), label: t.home.stats.scans },
            { value: fmt(stats.questions), label: t.home.stats.questions },
          ].map((stat) => (
            <div key={stat.label} className="text-center glass-card p-4">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <Link
              key={feature.key}
              href={feature.href}
              className={`glass-card p-6 hover:scale-[1.02] transition-all duration-300 group animate-fade-in-delay-${Math.min(i + 1, 3)}`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t.home.features[feature.key]}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t.home.features[feature.descKey]}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-card p-8 md:p-12 text-center">
          <MessageCircleQuestion className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">{t.qa.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {t.qa.subtitle}
          </p>
          <Link href="/qa" className="btn-primary">
            {t.qa.askQuestion}
          </Link>
        </div>
      </section>
    </div>
  );
}
