"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import {
  SHOP_PRODUCTS,
  type ShopCategory,
  type ShopProduct,
} from "@/data/shop-products";
import {
  isUserInIran,
  marketplaceBuyUrl,
} from "@/lib/shop-marketplace";

const CATEGORIES: ShopCategory[] = [
  "fungicide",
  "insecticide",
  "fertilizer",
  "soil",
  "growth_light",
  "tool",
];

export default function ShopPage() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const { formatNumber } = useLocaleFormat();
  const fa = locale === "fa";
  const [cat, setCat] = useState<ShopCategory | "all">("all");
  const iran = isUserInIran({ country: user?.country, locale });

  const catLabel = (c: ShopCategory) => {
    const map: Record<ShopCategory, { fa: string; en: string }> = {
      fungicide: { fa: "قارچ‌کش", en: "Fungicide" },
      insecticide: { fa: "حشره‌کش", en: "Insecticide" },
      fertilizer: { fa: "کود", en: "Fertilizer" },
      soil: { fa: "خاک", en: "Soil" },
      growth_light: { fa: "نور رشد", en: "Grow light" },
      tool: { fa: "ابزار", en: "Tools" },
    };
    return fa ? map[c].fa : map[c].en;
  };

  const items = useMemo(
    () =>
      SHOP_PRODUCTS.filter((p) => (cat === "all" ? true : p.category === cat)),
    [cat]
  );

  const buy = (p: ShopProduct) =>
    marketplaceBuyUrl({
      digikalaQuery: p.digikalaQuery,
      amazonQuery: p.amazonQuery,
      country: user?.country,
      locale,
    });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-emerald-600" />
          {fa ? "فروشگاه مراقبت" : "Care marketplace"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {fa
            ? iran
              ? "خرید از دیجی‌کالا — بر اساس کشور پروفایل یا موقعیت شما."
              : "خرید از آمازون — چون خارج از ایران تشخیص داده شدید. کشور را در تنظیمات می‌توانید عوض کنید."
            : iran
              ? "Checkout via Digikala based on your profile location."
              : "Checkout via Amazon — set country to Iran in settings for Digikala."}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {fa
            ? `بازار فعال: ${iran ? "دیجی‌کالا" : "آمازون"}`
            : `Active market: ${iran ? "Digikala" : "Amazon"}`}
          {user?.country
            ? fa
              ? ` · کشور پروفایل: ${user.country}`
              : ` · Profile country: ${user.country}`
            : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-full text-sm border ${
            cat === "all" ? "bg-primary text-primary-foreground" : ""
          }`}
          onClick={() => setCat("all")}
        >
          {fa ? "همه" : "All"}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`px-3 py-1.5 rounded-full text-sm border ${
              cat === c ? "bg-primary text-primary-foreground" : ""
            }`}
            onClick={() => setCat(c)}
          >
            {catLabel(c)}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((p) => {
          const link = buy(p);
          return (
            <div key={p.id} className="glass-card p-4 flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {catLabel(p.category)}
              </p>
              <h2 className="font-semibold text-sm">
                {fa ? p.nameFa : p.nameEn}
              </h2>
              <p className="text-xs text-muted-foreground flex-1">
                {fa ? p.summaryFa : p.summaryEn}
              </p>
              {iran && (
                <p className="text-sm font-bold">
                  {formatNumber(p.priceToman)} {fa ? "تومان ≈" : "Toman ≈"}
                </p>
              )}
              <div className="flex gap-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-sm flex-1 inline-flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {fa ? link.labelFa : link.labelEn}
                </a>
                <Link
                  href={`/shop/${p.slug}`}
                  className="btn-secondary text-sm px-3"
                >
                  {fa ? "جزئیات" : "Details"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
