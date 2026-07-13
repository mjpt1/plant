"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { getHealthStatusLabel } from "@/lib/healthStatus";
import { Loader2, Share2 } from "lucide-react";

export default function CareSharePage() {
  const params = useParams();
  const token = String(params.token || "");
  const { locale, t } = useLanguage();
  const [data, setData] = useState<{
    sharedBy: { name: string; username: string };
    plant: {
      nameEn: string;
      nameFa: string;
      healthStatus: string;
      careReminders: Array<{
        titleEn: string;
        titleFa: string;
        type: string;
        scheduledAt: string;
      }>;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/care/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 410 ? "expired" : "missing");
        return res.json();
      })
      .then(setData)
      .catch((err) =>
        setError(
          err.message === "expired"
            ? locale === "fa"
              ? "این لینک منقضی شده است."
              : "This share link has expired."
            : locale === "fa"
              ? "لینک پیدا نشد."
              : "Share link not found."
        )
      );
  }, [token, locale]);

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">{error}</p>
        <Link href="/" className="btn-primary inline-flex">
          {locale === "fa" ? "خانه" : "Home"}
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const name = locale === "fa" ? data.plant.nameFa : data.plant.nameEn;

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Share2 className="w-4 h-4" />
        {locale === "fa"
          ? `اشتراک‌گذاری مراقبت توسط ${data.sharedBy.name}`
          : `Care shared by ${data.sharedBy.name}`}
      </div>
      <h1 className="text-2xl font-bold">{name}</h1>
      <p className="text-sm text-muted-foreground">
        {locale === "fa" ? "وضعیت:" : "Status:"}{" "}
        {getHealthStatusLabel(data.plant.healthStatus, t)}
      </p>
      <div className="space-y-2">
        <h2 className="font-semibold">
          {locale === "fa" ? "یادآورهای پیش‌رو" : "Upcoming reminders"}
        </h2>
        {data.plant.careReminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {locale === "fa" ? "یادآوری فعالی نیست." : "No open reminders."}
          </p>
        ) : (
          data.plant.careReminders.map((r, i) => (
            <div key={i} className="glass-card p-3 text-sm">
              <p className="font-medium">
                {locale === "fa" ? r.titleFa : r.titleEn}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.scheduledAt).toLocaleString(
                  locale === "fa" ? "fa-IR" : "en-US"
                )}
              </p>
            </div>
          ))
        )}
      </div>
      <Link href="/auth/register" className="btn-primary w-full inline-flex justify-center">
        {locale === "fa" ? "ساخت حساب در گیاه‌یار" : "Join GiahYar"}
      </Link>
    </div>
  );
}
