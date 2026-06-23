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
    await expect(page.getByText("Editing question 2")).toBeVisible();
    await expect(page.getByRole("button", { name: /Question 2: New question/i })).toBeVisible();
  });

  test("editing question text updates the list card live", async ({ page }) => {
    await openNewInterviewBuilder(page, uniqueLabel("E2E Edit Text"));
    await page.getByRole("button", { name: /add a question/i }).click();
    await expect(page.getByText("Editing question 2")).toBeVisible();

    const customText = `What motivates you at work? ${Date.now()}`;
    await page.getByRole("textbox", { name: /question text/i }).fill(customText);

    await expect(
      page.getByRole("button", { name: new RegExp(`Question 2: ${customText}`) }),
    ).toBeVisible();

    await page.getByRole("textbox", { name: /question text/i }).blur();
    await page.reload();
    await expect(page.getByRole("button", { name: new RegExp(customText) })).toBeVisible();
  });

  test("switching questions shows the correct editor content", async ({ page }) => {
    await openNewInterviewBuilder(page, uniqueLabel("E2E Switch"));
    const q1Text = `Question one ${Date.now()}`;
    await page.getByRole("textbox", { name: /question text/i }).fill(q1Text);

    await page.getByRole("button", { name: /add a question/i }).click();
    const q2Text = `Question two ${Date.now()}`;
    await page.getByRole("textbox", { name: /question text/i }).fill(q2Text);

    await page.getByRole("button", { name: new RegExp(`Question 1: ${q1Text}`) }).click();
    await expect(page.getByText("Editing question 1")).toBeVisible();
    await expect(page.getByRole("textbox", { name: /question text/i })).toHaveValue(q1Text);

    await page.getByRole("button", { name: new RegExp(`Question 2: ${q2Text}`) }).click();
    await expect(page.getByText("Editing question 2")).toBeVisible();
    await expect(page.getByRole("textbox", { name: /question text/i })).toHaveValue(q2Text);
  });

  test("delete question removes it from the list", async ({ page }) => {
    await openNewInterviewBuilder(page, uniqueLabel("E2E Delete"));
    await page.getByRole("button", { name: /add a question/i }).click();
    await expect.poll(() => readQuestionCount(page)).toBe(2);

    await page.getByRole("button", { name: /delete question 2/i }).click();
    await expect.poll(() => readQuestionCount(page), { timeout: 20_000 }).toBe(1);
    await expect(page.getByRole("button", { name: /delete question/i })).toHaveCount(0);
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
