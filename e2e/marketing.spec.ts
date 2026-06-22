import { test, expect } from "@playwright/test";

test.describe("Marketing (public)", () => {
  test("landing page shows hero and pricing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /hire the human/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /start free/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /simple plans/i })).toBeVisible();
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /let's talk about your hiring/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /send message/i })).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});
