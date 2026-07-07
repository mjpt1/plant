import type { TranslationKeys } from "@/i18n/translations/en";

export function getHealthStatusLabel(
  status: string,
  t: TranslationKeys
): string {
  const labels: Record<string, string> = {
    healthy: t.scan.results.healthy,
    warning: t.scan.results.warning,
    critical: t.scan.results.critical,
    unknown: t.scan.results.unknown,
  };
  return labels[status] ?? status;
}

export function normalizePlantHealthStatus(
  status: string
): "healthy" | "warning" | "critical" {
  if (status === "warning" || status === "critical") return status;
  return "healthy";
}
