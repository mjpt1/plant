export type ShopCategory =
  | "fungicide"
  | "insecticide"
  | "fertilizer"
  | "soil"
  | "tool"
  | "growth_light";

export type ShopProduct = {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string;
  category: ShopCategory;
  priceToman: number;
  summaryFa: string;
  summaryEn: string;
  tags: string[];
  forProblems: string[];
  inStock: boolean;
};

/** Curated Iran-market care products (v1 catalog; checkout can wire later). */
export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "bordofix-100",
    slug: "bordeaux-fungicide",
    nameFa: "بردوفیکس ۱۰۰ سی‌سی",
    nameEn: "Bordeaux mix 100ml",
    category: "fungicide",
    priceToman: 45000,
    summaryFa: "قارچ‌کش و باکتری‌کش مسی برای لکه برگی، سفیدک و بیماری‌های قارچی رایج آپارتمانی.",
    summaryEn: "Copper fungicide for leaf spot, mildew, and common indoor fungal issues.",
    tags: ["قارچ", "لکه", "سفیدک"],
    forProblems: ["powdery mildew", "leaf spot", "سفیدک", "لکه برگی", "rust", "زنگ"],
    inStock: true,
  },
  {
    id: "confidor-50",
    slug: "confidor-insecticide",
    nameFa: "کنفیدور ۵۰ سی‌سی",
    nameEn: "Confidor 50ml",
    category: "insecticide",
    priceToman: 180000,
    summaryFa: "حشره‌کش سیستمیک برای شته، تریپس و برخی مکنده‌ها — با احتیاط و دوز دقیق استفاده شود.",
    summaryEn: "Systemic insecticide for aphids and thrips — use carefully at labeled dose.",
    tags: ["شته", "تریپس", "آفت"],
    forProblems: ["aphid", "شته", "thrips", "تریپس", "whitefly", "مگس سفید"],
    inStock: true,
  },
  {
    id: "neem-oil",
    slug: "neem-oil",
    nameFa: "روغن چریش گیاهی",
    nameEn: "Neem oil",
    category: "insecticide",
    priceToman: 120000,
    summaryFa: "گزینه ملایم‌تر برای شپشک آردی، کنه و پیشگیری دوره‌ای روی گیاهان آپارتمانی.",
    summaryEn: "Gentler option for mealybugs, mites, and preventive sprays.",
    tags: ["ارگانیک", "کنه", "شپشک"],
    forProblems: ["mealybug", "شپشک", "mite", "کنه", "spider"],
    inStock: true,
  },
  {
    id: "insect-soap",
    slug: "insecticidal-soap",
    nameFa: "صابون حشره‌کش آماده",
    nameEn: "Insecticidal soap",
    category: "insecticide",
    priceToman: 95000,
    summaryFa: "برای آلودگی‌های سطحی شته و شپشک؛ برگ‌ها را کامل پوشش دهید.",
    summaryEn: "For surface aphids and mealybugs; coat leaves thoroughly.",
    tags: ["شته", "ایمن‌تر"],
    forProblems: ["aphid", "شته", "mealybug", "شپشک"],
    inStock: true,
  },
  {
    id: "npk-20",
    slug: "npk-20-20-20",
    nameFa: "کود NPK ۲۰-۲۰-۲۰",
    nameEn: "NPK 20-20-20",
    category: "fertilizer",
    priceToman: 85000,
    summaryFa: "کود متعادل رشد برای فصل بهار و تابستان؛ هر ۳–۴ هفته رقیق‌شده.",
    summaryEn: "Balanced grow fertilizer for spring/summer; dilute every 3–4 weeks.",
    tags: ["کود", "رشد"],
    forProblems: ["nutrient", "کمبود", "deficiency", "کلروز"],
    inStock: true,
  },
  {
    id: "iron-chelate",
    slug: "iron-chelate",
    nameFa: "آهن کلاته",
    nameEn: "Chelated iron",
    category: "fertilizer",
    priceToman: 110000,
    summaryFa: "برای زردی بین رگبرگی (کمبود آهن) در گیاهان آپارتمانی حساس.",
    summaryEn: "For interveinal yellowing (iron deficiency) on sensitive houseplants.",
    tags: ["آهن", "زردی"],
    forProblems: ["iron", "آهن", "chlorosis", "کلروز"],
    inStock: true,
  },
  {
    id: "potting-mix",
    slug: "draining-potting-mix",
    nameFa: "خاک گلدانی با زهکشی خوب",
    nameEn: "Well-draining potting mix",
    category: "soil",
    priceToman: 75000,
    summaryFa: "ترکیب سبک برای جلوگیری از پوسیدگی ریشه در آپارتمان.",
    summaryEn: "Light mix to help prevent root rot indoors.",
    tags: ["خاک", "زهکشی"],
    forProblems: ["root rot", "پوسیدگی ریشه", "overwater"],
    inStock: true,
  },
  {
    id: "grow-light",
    slug: "led-grow-bar",
    nameFa: "لامپ رشد LED بار",
    nameEn: "LED grow light bar",
    category: "growth_light",
    priceToman: 450000,
    summaryFa: "برای اتاق‌های کم‌نور شمالی؛ ۸–۱۲ ساعت در روز.",
    summaryEn: "For dark north rooms; 8–12 hours daily.",
    tags: ["نور", "LED"],
    forProblems: ["low light", "نور کم", "dark"],
    inStock: true,
  },
  {
    id: "spray-bottle",
    slug: "hand-sprayer-2l",
    nameFa: "سم‌پاش دستی ۲ لیتری",
    nameEn: "2L hand sprayer",
    category: "tool",
    priceToman: 220000,
    summaryFa: "برای محلول‌پاشی یکنواخت کود، صابون یا قارچ‌کش.",
    summaryEn: "Even spraying of fertilizers, soap, or fungicide.",
    tags: ["ابزار"],
    forProblems: [],
    inStock: true,
  },
];

export function productsForProblems(
  labels: string[],
  limit = 4
): ShopProduct[] {
  if (!labels.length) {
    return SHOP_PRODUCTS.filter((p) => p.category === "fertilizer").slice(0, limit);
  }
  const joined = labels.join(" ").toLowerCase();
  const scored = SHOP_PRODUCTS.map((p) => {
    let score = 0;
    for (const key of p.forProblems) {
      if (joined.includes(key.toLowerCase())) score += 3;
    }
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);

  if (scored.length >= limit) return scored.slice(0, limit);
  const filler = SHOP_PRODUCTS.filter((p) => !scored.includes(p));
  return [...scored, ...filler].slice(0, limit);
}

export function getProductBySlug(slug: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((p) => p.slug === slug);
}
