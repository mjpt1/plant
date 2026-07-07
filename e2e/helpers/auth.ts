import { expect, type Page } from "@playwright/test";

export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
  expectedPath: RegExp
) {
  await page.goto("/auth/login");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByRole("button", { name: /Google|گوگل/i })).toBeVisible({
    timeout: 15_000,
  });

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /^Login$|^ورود$/i }).click();

  await page.waitForURL(expectedPath, { timeout: 30_000 });
}
