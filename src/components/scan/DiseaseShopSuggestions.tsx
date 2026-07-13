"use client";

import Link from "next/link";
import { productsForProblems } from "@/data/shop-products";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";

export function DiseaseShopSuggestions({
  labels,
  locale,
}: {
  labels: string[];
  locale: string;
}) {
  const fa = locale === "fa";
  const { formatNumber } = useLocaleFormat();
  const products = productsForProblems(labels, 3);
  if (!products.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-border/60 p-3 space-y-2">
      <p className="text-xs font-medium">
        {fa ? "محصولات پیشنهادی فروشگاه مراقبت" : "Suggested care products"}
      </p>
      <div className="space-y-2">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/shop/${p.slug}`}
            className="flex items-center justify-between gap-2 text-sm hover:underline"
          >
            <span>{fa ? p.nameFa : p.nameEn}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatNumber(p.priceToman)} {fa ? "تومان" : "T"}
            </span>
          </Link>
        ))}
      </div>
      <Link href="/shop" className="text-xs text-primary">
        {fa ? "مشاهده فروشگاه ←" : "Browse shop →"}
      </Link>
    </div>
  );
}
