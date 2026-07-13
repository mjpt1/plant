"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  BadgeCheck,
  Search,
  MessageCircleQuestion,
  BarChart3,
  BookOpen,
  MessageSquareHeart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDateTime } from "@/utils/dateHelper";

interface ExpertStats {
  answers: number;
  accepted: number;
  verified: number;
  openQuestions: number;
}

interface CatalogPlant {
  id: string;
  slug: string;
  nameEn: string;
  nameFa: string;
  scientificName: string | null;
  category: string;
  expertInsight: string | null;
}

type Consultation = {
  id: string;
  subject: string;
  message: string;
  reply: string | null;
  status: string;
  createdAt: string;
  user?: { name: string; username: string };
};

export default function ExpertPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const { formatNumber } = useLocaleFormat();
  const router = useRouter();
  const [tab, setTab] = useState<"insights" | "stats" | "consults">("insights");
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [query, setQuery] = useState("");
  const [plants, setPlants] = useState<CatalogPlant[]>([]);
  const [selected, setSelected] = useState<CatalogPlant | null>(null);
  const [insight, setInsight] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [consults, setConsults] = useState<Consultation[]>([]);
  const [consultsLoading, setConsultsLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  const fa = locale === "fa";

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/expert/stats");
    if (res.ok) setStats((await res.json()).stats);
    else toast.error(t.common.error);
  }, [t.common.error]);

  const searchPlants = useCallback(async (q: string) => {
    setSearching(true);
    const res = await fetch(`/api/expert/catalog?q=${encodeURIComponent(q)}&limit=20`);
    const data = await res.json();
    if (res.ok) setPlants(data.plants || []);
    setSearching(false);
  }, []);

  const loadConsults = useCallback(async () => {
    setConsultsLoading(true);
    try {
      const res = await fetch("/api/consultations");
      if (!res.ok) throw new Error("fail");
      const data = await res.json();
      setConsults(data.consultations || []);
    } catch {
      toast.error(t.common.error);
    } finally {
      setConsultsLoading(false);
    }
  }, [t.common.error]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "EXPERT" && user.role !== "ADMIN")) {
      router.push("/dashboard");
      return;
    }
    fetchStats();
    searchPlants("");
  }, [user, authLoading, router, fetchStats, searchPlants]);

  useEffect(() => {
    const timer = setTimeout(() => searchPlants(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchPlants]);

  useEffect(() => {
    if (tab === "consults") void loadConsults();
  }, [tab, loadConsults]);

  const selectPlant = (plant: CatalogPlant) => {
    setSelected(plant);
    setInsight(plant.expertInsight || "");
  };

  const saveInsight = async () => {
    if (!selected || insight.trim().length < 10) return;
    setSaving(true);
    const res = await fetch("/api/expert/catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogId: selected.id, expertInsight: insight.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t.expert.insightSaved);
      setPlants((prev) =>
        prev.map((p) => (p.id === selected.id ? { ...p, expertInsight: insight.trim() } : p))
      );
      setSelected((p) => (p ? { ...p, expertInsight: insight.trim() } : p));
    } else {
      toast.error(t.common.error);
    }
  };

  const openConsultCount = consults.filter((c) => c.status === "OPEN").length;

  if (authLoading || !user || (user.role !== "EXPERT" && user.role !== "ADMIN")) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BadgeCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t.expert.title}</h1>
          <p className="text-muted-foreground">{t.expert.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={tab === "insights" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("insights")}
        >
          <BookOpen className="w-4 h-4" />
          {t.expert.insights}
        </Button>
        <Button
          variant={tab === "consults" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("consults")}
        >
          <MessageSquareHeart className="w-4 h-4" />
          {t.expert.consultations}
          {tab === "consults" && openConsultCount > 0 ? (
            <span className="ms-1 text-xs opacity-80">({formatNumber(openConsultCount)})</span>
          ) : null}
        </Button>
        <Button
          variant={tab === "stats" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("stats")}
        >
          <BarChart3 className="w-4 h-4" />
          {t.expert.stats}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/qa">
            <MessageCircleQuestion className="w-4 h-4" />
            {t.expert.goToQa}
          </Link>
        </Button>
      </div>

      {tab === "stats" && stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: t.expert.myAnswers, value: stats.answers },
            { label: t.expert.acceptedAnswers, value: stats.accepted },
            { label: t.expert.verifiedAnswers, value: stats.verified },
            { label: t.expert.openQuestions, value: stats.openQuestions },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-0">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{formatNumber(s.value)}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "consults" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t.expert.consultationsHint}</p>
          {consultsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : consults.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {t.expert.noConsultations}
            </p>
          ) : (
            consults.map((c) => (
              <Card key={c.id} className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex flex-wrap items-center gap-2">
                    <span>{c.subject}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        c.status === "OPEN"
                          ? "bg-amber-500/15 text-amber-700"
                          : "bg-emerald-500/15 text-emerald-700"
                      }`}
                    >
                      {c.status === "OPEN" ? t.expert.openConsult : t.expert.answeredConsult}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {c.user?.name || c.user?.username || "—"} ·{" "}
                    {formatDateTime(c.createdAt, locale)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm whitespace-pre-wrap">{c.message}</p>
                  {c.reply ? (
                    <div className="rounded-xl bg-emerald-500/10 p-3 text-sm">
                      <p className="text-xs font-medium text-emerald-700 mb-1">
                        {fa ? "پاسخ شما" : "Your reply"}
                      </p>
                      <p className="whitespace-pre-wrap">{c.reply}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        rows={3}
                        value={replyDrafts[c.id] || ""}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder={t.expert.replyPlaceholder}
                      />
                      <Button
                        size="sm"
                        disabled={
                          replyingId === c.id || !(replyDrafts[c.id] || "").trim()
                        }
                        onClick={async () => {
                          const reply = (replyDrafts[c.id] || "").trim();
                          if (!reply) return;
                          setReplyingId(c.id);
                          try {
                            const res = await fetch("/api/consultations", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: c.id, reply }),
                            });
                            if (!res.ok) throw new Error("fail");
                            toast.success(t.expert.replySent);
                            setReplyDrafts((prev) => {
                              const next = { ...prev };
                              delete next[c.id];
                              return next;
                            });
                            void loadConsults();
                          } catch {
                            toast.error(t.common.error);
                          } finally {
                            setReplyingId(null);
                          }
                        }}
                      >
                        {replyingId === c.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        {t.expert.sendReply}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/consultations">{t.expert.openFullConsultations}</Link>
          </Button>
        </div>
      )}

      {tab === "insights" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="relative mb-4">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.expert.searchPlant}
                className="ps-9"
              />
            </div>
            {searching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : plants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t.expert.noPlants}</p>
            ) : (
              <div className="space-y-2 max-h-[28rem] overflow-y-auto">
                {plants.map((plant) => (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => selectPlant(plant)}
                    className={`w-full text-start glass-card p-3 rounded-xl transition-all ${
                      selected?.id === plant.id ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <p className="font-medium text-sm">
                      {locale === "fa" ? plant.nameFa : plant.nameEn}
                    </p>
                    <p className="text-xs text-muted-foreground">{plant.scientificName}</p>
                    {plant.expertInsight && (
                      <p className="text-[10px] text-emerald-600 mt-1">✓ {t.expert.insights}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-base">
                {selected
                  ? locale === "fa"
                    ? selected.nameFa
                    : selected.nameEn
                  : t.expert.insights}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selected ? (
                <>
                  <Textarea
                    value={insight}
                    onChange={(e) => setInsight(e.target.value)}
                    placeholder={t.expert.insightPlaceholder}
                    rows={8}
                  />
                  <Button
                    onClick={saveInsight}
                    disabled={saving || insight.trim().length < 10}
                    className="w-full"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.expert.saveInsight}
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/catalog/${selected.slug}`}>{t.catalog.viewDetails}</Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t.expert.noPlants}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
