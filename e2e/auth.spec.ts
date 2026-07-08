import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Authentication", () => {
  test("login page renders OAuth and email form", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(
      page.getByRole("heading", { name: /Welcome Back|خوش آمدید/i })
    ).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Google|گوگل/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /GitHub|گیت‌?هاب/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Instagram|اینستاگرام/i })).toBeVisible();
  });

  test("demo login reaches dashboard", async ({ page }) => {
    await loginWithCredentials(
      page,
      "demo@plantcare.ir",
      "demo1234",
      /\/dashboard/
    );
    await expect(page.getByRole("link", { name: /Dashboard|داشبورد/i }).first()).toBeVisible();
  });

  test("admin login reaches admin panel", async ({ page }) => {
    await loginWithCredentials(
      page,
      "admin@plantcare.ir",
      "admin1234",
      /\/admin/
    );
    await expect(
      page.getByRole("heading", { name: /Admin Dashboard|پنل مدیریت/i })
    ).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(
      page.getByRole("heading", { name: /به گیاه‌یار/i })
    ).toBeVisible();
    await expect(page.getByLabel(/Username|نام کاربری/i)).toBeVisible();
  });
});
