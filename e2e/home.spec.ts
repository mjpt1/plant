import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("loads hero and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Personal Plant Doctor/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Plant Library/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Scan/i }).first()).toBeVisible();
  });

  test("shows public stats from API", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Plants in Library/i)).toBeVisible({ timeout: 15_000 });
  });
});
