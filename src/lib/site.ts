import { resolveAppUrl } from "@/lib/app-url";

export const siteConfig = {
  name: "گیاه‌یار",
  nameFa: "گیاه‌یار",
  title: "گیاه‌یار — شناسایی و مراقبت از گیاهان",
  description:
    "شناسایی گیاه، تشخیص بیماری، ارتباط با باغبانان و مدیریت برنامه مراقبت از گیاهان. Identify plants, diagnose diseases, and manage your plant care schedule.",
  descriptionFa:
    "شناسایی گیاه، تشخیص بیماری، ارتباط با باغبانان و مدیریت برنامه مراقبت از گیاهان.",
  url: resolveAppUrl(),
  locale: "fa_IR",
  themeColor: "#10b981",
  keywords: [
    "گیاه‌یار",
    "شناسایی گیاه",
    "مراقبت از گیاه",
    "گیاه آپارتمانی",
    "plant identification",
    "plant care",
    "garden",
    "watering reminder",
  ],
} as const;
