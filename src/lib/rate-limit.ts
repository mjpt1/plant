import { getRedis, isRedisConfigured } from "@/lib/redis";

const buckets = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }
  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  buckets.set(key, existing);
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Sync fallback used by tests and when Redis is unavailable. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  return memoryRateLimit(key, limit, windowMs);
}

/** Prefer Redis INCR when Upstash is configured (multi-instance safe). */
export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  if (!isRedisConfigured()) {
    return memoryRateLimit(key, limit, windowMs);
  }

  const redis = getRedis();
  if (!redis) return memoryRateLimit(key, limit, windowMs);

  const redisKey = `giahyar:ratelimit:${key}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }
    const ttl = await redis.ttl(redisKey);
    const resetAt =
      Date.now() + (ttl > 0 ? ttl * 1000 : windowMs);
    if (count > limit) {
      return { success: false, remaining: 0, resetAt };
    }
    return { success: true, remaining: Math.max(0, limit - count), resetAt };
  } catch {
    return memoryRateLimit(key, limit, windowMs);
  }
}

/** Clears in-memory buckets — for tests only. */
export function resetRateLimitStore() {
  buckets.clear();
}
