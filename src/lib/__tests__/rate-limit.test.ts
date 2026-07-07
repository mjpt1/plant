import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimitStore } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests under the limit", () => {
    const first = rateLimit("user:1", 3, 60_000);
    const second = rateLimit("user:1", 3, 60_000);

    expect(first.success).toBe(true);
    expect(first.remaining).toBe(2);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it("blocks requests over the limit", () => {
    rateLimit("user:2", 2, 60_000);
    rateLimit("user:2", 2, 60_000);
    const blocked = rateLimit("user:2", 2, 60_000);

    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("isolates keys", () => {
    rateLimit("user:a", 1, 60_000);
    const blockedA = rateLimit("user:a", 1, 60_000);
    const allowedB = rateLimit("user:b", 1, 60_000);

    expect(blockedA.success).toBe(false);
    expect(allowedB.success).toBe(true);
  });
});
