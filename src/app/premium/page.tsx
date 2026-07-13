"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Crown, Check } from "lucide-react";

export default function PremiumPage() {
  const { locale } = useLanguage();
  const fa = locale === "fa";

  const features = fa
    ? [
        "اسکن و تشخیص بیماری بدون محدودیت روزانه",
        "مشاوره کارشناس با اولویت پاسخ",
        "ژورنال پیشرفت و اشتراک مراقبت نامحدود",
        "پشتیبانی از مدل بیماری اختصاصی (به‌زودی)",
      ]
    : [
        "Higher daily scan & disease diagnosis limits",
        "Priority expert consultation replies",
        "Unlimited progress journal & care sharing",
        "Dedicated disease model access (coming soon)",
      ];

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-2">
        <Crown className="w-10 h-10 mx-auto text-amber-500" />
        <h1 className="text-2xl font-bold">
          {fa ? "گیاه‌یار پلاس" : "GiahYar Plus"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fa
            ? "پرداخت آنلاین به‌زودی فعال می‌شود. فعلاً همه قابلیت‌های پایه رایگان‌اند."
            : "Online billing is coming soon. Core features stay free for now."}
        </p>
      </div>

      <div className="glass-card p-5 space-y-3">
        {features.map((f) => (
          <div key={f} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      <button type="button" className="btn-primary w-full opacity-80" disabled>
        {fa ? "به‌زودی — عضویت پلاس" : "Coming soon — Join Plus"}
      </button>

      <Link href="/consultations" className="btn-secondary w-full inline-flex justify-center">
        {fa ? "درخواست مشاوره کارشناس" : "Request expert help"}
      </Link>
    </div>
  );
}
