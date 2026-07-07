import { test, expect } from "@playwright/test";

test.describe("Offline page", () => {
  test("renders offline fallback UI", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.getByRole("heading", { name: /Offline|آفلاین/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Try Again|تلاش مجدد/i })).toBeVisible();
  });
});
