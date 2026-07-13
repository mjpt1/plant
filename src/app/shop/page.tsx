"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import {
  SHOP_PRODUCTS,
  type ShopCategory,
  type ShopProduct,
} from "@/data/shop-products";

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
  const { formatNumber } = useLocaleFormat();
  const fa = locale === "fa";
  const [cat, setCat] = useState<ShopCategory | "all">("all");
  const [cart, setCart] = useState<Record<string, number>>({});

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

  const total = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = SHOP_PRODUCTS.find((x) => x.id === id);
      return sum + (p ? p.priceToman * qty : 0);
    }, 0);
  }, [cart]);

  const add = (p: ShopProduct) => {
    setCart((prev) => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-emerald-600" />
          {fa ? "فروشگاه مراقبت" : "Care marketplace"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {fa
            ? "کود، سم و ابزار رایج بازار ایران — بعد از تشخیص بیماری، محصولات مرتبط پیشنهاد می‌شود."
            : "Iran-market fertilizers, treatments, and tools — linked from disease diagnosis."}
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
        {items.map((p) => (
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
            <p className="text-sm font-bold">
              {formatNumber(p.priceToman)} {fa ? "تومان" : "Toman"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary text-sm flex-1"
                onClick={() => add(p)}
                disabled={!p.inStock}
              >
                {fa ? "افزودن" : "Add"}
              </button>
              <Link
                href={`/shop/${p.slug}`}
                className="btn-secondary text-sm px-3"
              >
                {fa ? "جزئیات" : "Details"}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="sticky bottom-20 lg:bottom-4 glass-card p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            {fa ? "جمع سبد" : "Cart total"}:{" "}
            <span className="font-bold">
              {formatNumber(total)} {fa ? "تومان" : "Toman"}
            </span>
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              alert(
                fa
                  ? "پرداخت آنلاین به‌زودی فعال می‌شود. فعلاً می‌توانید از طریق مشاوره کارشناس یا فروشگاه‌های محلی سفارش دهید."
                  : "Online checkout coming soon. For now order via expert consult or local shops."
              )
            }
          >
            {fa ? "ادامه خرید" : "Checkout"}
          </button>
        </div>
      )}
    </div>
  );
}
