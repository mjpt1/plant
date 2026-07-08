/** Common botanical family labels (Latin → Persian display). */
const FAMILY_FA: Record<string, string> = {
  Araceae: "آراسه (شیپوریان)",
  Asparagaceae: "مارچوبهیان",
  Asteraceae: "کاسنیان",
  Cactaceae: "کاکتوسیان",
  Crassulaceae: "کراسولاسه",
  Fabaceae: "باقلاییان",
  Lamiaceae: "نعنائیان",
  Rosaceae: "رزسانان",
  Rutaceae: "سردابسانان",
  Solanaceae: "بادنجانیان",
  Apiaceae: "چتریان",
  Poaceae: "گندمیان",
  Orchidaceae: "ثعلبیان",
  Arecaceae: "نخل‌سانان",
  Moraceae: "توتیان",
  Oleaceae: "زیتونیان",
  Malvaceae: "پنیرکیان",
  Brassicaceae: "کلمیان",
  Cucurbitaceae: "کدوئیان",
  Marantaceae: "مارانتاسه",
  Begoniaceae: "بگونیاسیان",
  Geraniaceae: "شمعدانیان",
  Iridaceae: "زنبقیان",
  Myrtaceae: "موردی‌سانان",
  Pinaceae: "کاجیان",
  Cupressaceae: "سرویان",
  Euphorbiaceae: "فرفیونیان",
  Apocynaceae: "خرزهره‌ایان",
  Boraginaceae: "گاو‌زبانیان",
  Ranunculaceae: "آلاله‌ایان",
  Papaveraceae: "شقایقیان",
  Zingiberaceae: "زنجبیلیان",
  Bromeliaceae: "بروملیاسه",
  Piperaceae: "فلفلیان",
};

export function formatBotanicalFamily(
  family: string | null | undefined,
  locale?: string
): string {
  if (!family) return "";
  const trimmed = family.trim();
  if (!trimmed) return "";
  if (locale !== "fa") return trimmed;
  const fa = FAMILY_FA[trimmed];
  return fa ? `${trimmed} — ${fa.trim()}` : trimmed;
}
