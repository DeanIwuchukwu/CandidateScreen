import { test, expect } from "@playwright/test";
import {
  openNewInterviewBuilder,
  readQuestionCount,
  toggleByLabel,
  uniqueLabel,
} from "../playwright/helpers";

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

    await page.getByRole("button", { name: /save settings/i }).click();

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
