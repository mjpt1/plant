import { test, expect } from "@playwright/test";

test.describe("Catalog", () => {
  test("lists plants from database", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page.getByPlaceholder(/Search plants|جستجوی گیاه/i)).toBeVisible();
    await expect(page.locator("article, .glass-card, a[href^='/catalog/']").first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("catalog API returns plants", async ({ request }) => {
    const res = await request.get("/api/catalog?limit=2");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.plants).toBeDefined();
    expect(Array.isArray(data.plants)).toBe(true);
    expect(data.plants.length).toBeGreaterThan(0);
  });
});
