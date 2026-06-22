import { test, expect } from "@playwright/test";

test.describe("Candidate flow (public)", () => {
  test("invalid invite token shows not found", async ({ page }) => {
    await page.goto("/i/demo");
    await expect(page.getByRole("heading", { name: /interview not found/i })).toBeVisible();
  });

  test("valid invite token opens intro when E2E_INVITE_TOKEN is set", async ({ page }) => {
    const token = process.env.E2E_INVITE_TOKEN;
    test.skip(!token, "Set E2E_INVITE_TOKEN in .env.e2e to a live invite link token");

    await page.goto(`/i/${token}`);
    await expect(page.getByText(/video interview/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /get started/i })).toBeVisible();
  });
});
