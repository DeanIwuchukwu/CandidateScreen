import { test, expect, type Page } from "@playwright/test";

function uniqueLabel(prefix: string) {
  return `${prefix} ${Date.now()}`;
}

async function createDraftInterview(page: Page, title: string) {
  await page.goto("/app/interviews/new");
  await page.getByRole("textbox", { name: /role title/i }).fill(title);
  await page.getByRole("button", { name: /continue to builder/i }).click();
  await expect(page).toHaveURL(/\/app\/interviews\/[^/]+\/build/, { timeout: 30_000 });
}

test.describe("Interviews list", () => {
  test("delete draft interview from actions menu", async ({ page }) => {
    const title = uniqueLabel("E2E Delete Interview");
    await createDraftInterview(page, title);

    await page.goto("/app/interviews?tab=Draft");
    await expect(page.getByRole("heading", { name: /interviews/i })).toBeVisible();
    await expect(page.getByRole("link", { name: title })).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: new RegExp(`Actions for ${title}`) }).click();
    await page.getByRole("menuitem", { name: /delete interview/i }).click();

    await expect(page.getByRole("link", { name: title })).not.toBeVisible({ timeout: 20_000 });
  });
});
