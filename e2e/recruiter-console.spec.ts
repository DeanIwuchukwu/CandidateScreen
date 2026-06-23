import { test, expect } from "@playwright/test";

test.describe("Recruiter console", () => {
  test("dashboard and main nav routes load", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Interviews" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Candidates" })).toBeVisible();

    await page.getByRole("link", { name: "Interviews" }).click();
    await expect(page).toHaveURL(/\/app\/interviews/);
    await expect(page.getByRole("heading", { name: /interviews/i })).toBeVisible();

    await page.getByRole("link", { name: "Candidates" }).click();
    await expect(page).toHaveURL(/\/app\/candidates/);
    await expect(page.getByRole("heading", { name: /candidates/i })).toBeVisible();

    await page.getByRole("link", { name: "Analytics" }).click();
    await expect(page).toHaveURL(/\/app\/analytics/);
    await expect(page.getByRole("heading", { name: /analytics/i })).toBeVisible();

    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/app\/settings/);
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  });

  test("logout returns to login", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
