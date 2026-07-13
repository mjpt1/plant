"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { productsForProblems } from "@/data/shop-products";
import { marketplaceBuyUrl } from "@/lib/shop-marketplace";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";

export function DiseaseShopSuggestions({
  labels,
  locale,
}: {
  labels: string[];
  locale: string;
}) {
  const fa = locale === "fa";
  const { user } = useAuth();
  const { formatNumber } = useLocaleFormat();
  const products = productsForProblems(labels, 3);
  if (!products.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-border/60 p-3 space-y-2">
      <p className="text-xs font-medium">
        {fa ? "محصولات پیشنهادی برای خرید" : "Suggested products to buy"}
      </p>
      <div className="space-y-2">
        {products.map((p) => {
          const link = marketplaceBuyUrl({
            digikalaQuery: p.digikalaQuery,
            amazonQuery: p.amazonQuery,
            country: user?.country,
            locale,
          });
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="min-w-0 truncate">
                {fa ? p.nameFa : p.nameEn}
                {link.market === "digikala" ? (
                  <span className="text-[10px] text-muted-foreground ms-1">
                    ({formatNumber(p.priceToman)} {fa ? "تومان≈" : "T≈"})
                  </span>
                ) : null}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs text-primary inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                {fa
                  ? link.market === "digikala"
                    ? "دیجی‌کالا"
                    : "آمازون"
                  : link.market === "digikala"
                    ? "Digikala"
                    : "Amazon"}
              </a>
            </div>
          );
        })}
      </div>
      <Link href="/shop" className="text-xs text-primary">
        {fa ? "مشاهده فروشگاه ←" : "Browse shop →"}
      </Link>
    </div>
  );
}
