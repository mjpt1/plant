export const QA_CATEGORIES = [
  "soil",
  "pest",
  "watering",
  "disease",
  "sunlight",
  "fertilizer",
  "care",
  "general",
] as const;

export type QaCategory = (typeof QA_CATEGORIES)[number];

export const QA_CATEGORY_FILTER = ["all", ...QA_CATEGORIES] as const;
