import type { Page } from "@playwright/test";

export function uniqueLabel(prefix: string) {
  return `${prefix} ${Date.now()}`;
}

export async function openNewInterviewBuilder(page: Page, title: string) {
  await page.goto("/app/interviews/new");
  await page.getByRole("textbox", { name: /role title/i }).fill(title);
  await page.getByRole("button", { name: /continue to builder/i }).click();
}

export function questionCountLocator(page: Page) {
  return page.getByText(/questions · \d+/i);
}

export async function readQuestionCount(page: Page): Promise<number> {
  const text = await questionCountLocator(page).textContent();
  const match = text?.match(/questions · (\d+)/i);
  return match ? Number(match[1]) : 0;
}

export function toggleByLabel(page: Page, label: string) {
  return page
    .locator("div")
    .filter({ has: page.getByText(label, { exact: true }) })
    .getByRole("switch");
}
