export function getExpertInsight(rawData: unknown): string | null {
  if (!rawData || typeof rawData !== "object") return null;
  const raw = rawData as Record<string, unknown>;
  const insights = raw.expertInsights as Array<{ text?: string }> | undefined;
  return insights?.[0]?.text ?? null;
}

export function setExpertInsight(
  rawData: unknown,
  text: string,
  authorId: string
): Record<string, unknown> {
  const base =
    rawData && typeof rawData === "object"
      ? { ...(rawData as Record<string, unknown>) }
      : {};
  base.expertInsights = [
    {
      text,
      authorId,
      updatedAt: new Date().toISOString(),
    },
  ];
  return base;
}
