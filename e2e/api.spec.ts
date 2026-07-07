import { test, expect } from "@playwright/test";

test.describe("Public API", () => {
  test("stats endpoint returns counts", async ({ request }) => {
    const res = await request.get("/api/stats");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.stats.plants).toBeGreaterThan(0);
    expect(data.stats.users).toBeGreaterThanOrEqual(0);
  });

  test("oauth status lists providers", async ({ request }) => {
    const res = await request.get("/api/auth/oauth-status");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.providers).toHaveLength(3);
    expect(data.providers.map((p: { id: string }) => p.id)).toEqual(
      expect.arrayContaining(["google", "github", "instagram"])
    );
  });

  test("protected dashboard API requires auth", async ({ request }) => {
    const res = await request.get("/api/dashboard");
    expect(res.status()).toBe(401);
  });
});
