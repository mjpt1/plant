"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { getProductBySlug } from "@/data/shop-products";

export default function ShopProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useLanguage();
  const { formatNumber } = useLocaleFormat();
  const fa = locale === "fa";
  const product = getProductBySlug(String(slug));

  if (!product) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="mb-4">{fa ? "محصول پیدا نشد" : "Product not found"}</p>
        <Link href="/shop" className="btn-primary">
          {fa ? "بازگشت به فروشگاه" : "Back to shop"}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
      <Link href="/shop" className="text-sm text-muted-foreground">
        ← {fa ? "فروشگاه" : "Shop"}
      </Link>
      <h1 className="text-2xl font-bold">
        {fa ? product.nameFa : product.nameEn}
      </h1>
      <p className="text-sm text-muted-foreground">
        {fa ? product.summaryFa : product.summaryEn}
      </p>
      <p className="text-lg font-bold">
        {formatNumber(product.priceToman)} {fa ? "تومان" : "Toman"}
      </p>
      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {product.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Link href="/assistant" className="btn-secondary flex-1 text-center">
          {fa ? "سؤال از دستیار" : "Ask assistant"}
        </Link>
        <Link href="/scan" className="btn-primary flex-1 text-center">
          {fa ? "اسکن بیماری" : "Scan disease"}
        </Link>
      </div>
    </div>
  );
}
