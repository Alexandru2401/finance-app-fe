import { expect, test } from "@playwright/test";

test("shows the login form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.locator('input[type="password"]')).toBeVisible();
});
