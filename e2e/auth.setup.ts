import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate recruiter test account", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing E2E_EMAIL or E2E_PASSWORD. Copy .env.e2e.example to .env.e2e and set your production test account.",
    );
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/app/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /dashboard|good morning|interviews/i }).first()).toBeVisible({
    timeout: 15_000,
  });

  await page.context().storageState({ path: authFile });
});
