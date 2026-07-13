/** Marketplace outbound links: Digikala (Iran) vs Amazon (elsewhere). */

export function isUserInIran(options?: {
  country?: string | null;
  locale?: string | null;
}): boolean {
  const country = (options?.country || "").trim().toLowerCase();
  if (country) {
    if (
      country === "ir" ||
      country === "iran" ||
      country.includes("iran") ||
      country.includes("ایران") ||
      country.includes("islamic republic of iran")
    ) {
      return true;
    }
    // Explicit non-Iran country → abroad
    return false;
  }

  if (typeof Intl !== "undefined") {
    try {
      if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Tehran") {
        return true;
      }
    } catch {
      /* ignore */
    }
  }

  // No profile country: prefer Digikala for Persian UI
  return options?.locale === "fa";
}

export function digikalaSearchUrl(query: string): string {
  const q = encodeURIComponent(query.trim());
  return `https://www.digikala.com/search/?q=${q}`;
}

export function amazonSearchUrl(query: string): string {
  const q = encodeURIComponent(query.trim());
  return `https://www.amazon.com/s?k=${q}`;
}

export function marketplaceBuyUrl(params: {
  digikalaQuery: string;
  amazonQuery: string;
  country?: string | null;
  locale?: string | null;
}): { url: string; market: "digikala" | "amazon"; labelFa: string; labelEn: string } {
  const iran = isUserInIran({
    country: params.country,
    locale: params.locale,
  });
  if (iran) {
    return {
      url: digikalaSearchUrl(params.digikalaQuery),
      market: "digikala",
      labelFa: "خرید از دیجی‌کالا",
      labelEn: "Buy on Digikala",
    };
  }
  return {
    url: amazonSearchUrl(params.amazonQuery),
    market: "amazon",
    labelFa: "خرید از آمازون",
    labelEn: "Buy on Amazon",
  };
}
