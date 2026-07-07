import type { Prisma } from "@prisma/client";

export function parseJson<T>(
  value: string | Prisma.JsonValue | null | undefined,
  fallback: T
): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function parseTags(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  return parseJson<string[]>(value, []);
}
