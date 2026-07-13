import { Redis } from "@upstash/redis";

let redis: Redis | null | undefined;

export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  if (!isRedisConfigured()) {
    redis = null;
    return redis;
  }
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return redis;
}

/** Namespaced keys: giahyar:catalog:search:{hash} */
export function catalogSearchKey(parts: Record<string, string | number>): string {
  const normalized = Object.keys(parts)
    .sort()
    .map((k) => `${k}=${parts[k]}`)
    .join("&");
  return `giahyar:catalog:search:${Buffer.from(normalized).toString("base64url")}`;
}

const DEFAULT_TTL_SECONDS = 60 * 10; // 10 minutes

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return (await client.get<T>(key)) ?? null;
  } catch {
    return null;
  }
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch {
    /* ignore cache write failures */
  }
}
