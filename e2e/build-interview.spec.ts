import { test, expect, type Page } from "@playwright/test";

function uniqueLabel(prefix: string) {
  return `${prefix} ${Date.now()}`;
}

async function openNewInterviewBuilder(page: Page, title: string) {
  await page.goto("/app/interviews/new");
  await page.getByRole("textbox", { name: /role title/i }).fill(title);
  await page.getByRole("button", { name: /continue to builder/i }).click();
}

async function readQuestionCount(page: Page): Promise<number> {
  const text = await page.getByText(/questions · \d+/i).textContent();
  const match = text?.match(/questions · (\d+)/i);
  return match ? Number(match[1]) : 0;
}

function toggleByLabel(page: Page, label: string) {
  return page.getByText(label, { exact: true }).locator("xpath=..").getByRole("switch");
}

test.describe("Build interview", () => {
  test("add question increases the question count", async ({ page }) => {
    await openNewInterviewBuilder(page, uniqueLabel("E2E Add Question"));
    await expect(page).toHaveURL(/\/app\/interviews\/[^/]+\/build/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /build an interview/i })).toBeVisible();

    const before = await readQuestionCount(page);
    expect(before).toBeGreaterThanOrEqual(1);

    await page.getByRole("button", { name: /add a question/i }).click();

    await expect.poll(() => readQuestionCount(page), { timeout: 20_000 }).toBe(before + 1);
    await expect(page.getByText(/new question/i).first()).toBeVisible();
  });

  test("settings toggles persist after save", async ({ page }) => {
    await openNewInterviewBuilder(page, uniqueLabel("E2E Toggles"));
    await expect(page.getByRole("heading", { name: /build an interview/i })).toBeVisible();

    const idToggle = toggleByLabel(page, "Require ID check");
    await expect(idToggle).toBeVisible();

    const wasOn = (await idToggle.getAttribute("aria-checked")) === "true";
    await idToggle.click();
    await expect(idToggle).toHaveAttribute("aria-checked", wasOn ? "false" : "true");

    const saveResponse = page.waitForResponse(
      (response) => response.request().method() === "POST" && response.ok(),
    );
    await page.getByRole("button", { name: /save settings/i }).click();
    await saveResponse;

    await page.reload();
    await expect(page.getByRole("heading", { name: /build an interview/i })).toBeVisible();

    const afterReload = toggleByLabel(page, "Require ID check");
    await expect(afterReload).toHaveAttribute("aria-checked", wasOn ? "false" : "true");
  });

  test("publish button is present on builder", async ({ page }) => {
    await openNewInterviewBuilder(page, uniqueLabel("E2E Publish"));
    await expect(page.getByRole("heading", { name: /build an interview/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /publish/i })).toBeVisible();
  });
});
