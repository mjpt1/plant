export const siteConfig = {
  name: "PlantCare",
  nameFa: "گیاه‌یار",
  title: "گیاه‌یار | PlantCare - Plant Identification & Care",
  description:
    "Identify plants, diagnose diseases, connect with gardeners, and manage your plant care schedule. شناسایی گیاه، تشخیص بیماری و مدیریت مراقبت.",
  descriptionFa:
    "شناسایی گیاه، تشخیص بیماری، ارتباط با باغبانان و مدیریت برنامه مراقبت از گیاهان.",
  url: process.env.NEXTAUTH_URL || "https://plantcare.ir",
  locale: "en_US",
  themeColor: "#10b981",
  keywords: [
    "plant identification",
    "plant care",
    "garden",
    "plant disease",
    "watering reminder",
    "شناسایی گیاه",
    "مراقبت از گیاه",
    "گیاه آپارتمانی",
  ],
} as const;
