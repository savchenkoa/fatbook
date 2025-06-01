import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should show user name in navbar", async ({ page }) => {
    await page.goto("/");

    // Check that we're logged in
    await expect(page.getByText(process.env.E2E_TEST_EMAIL)).toBeVisible();
  });

  test("should navigate between main pages", async ({ page }) => {
    await page.goto("/");

    // Should redirect to eatings page
    await expect(page).toHaveURL(/\/eatings/);

    // Navigate to dishes
    await page.getByRole("link", { name: "Dishes" }).click();
    await expect(page).toHaveURL("/dishes");
    await expect(
      page.getByRole("heading", { name: "My Dishes" }),
    ).toBeVisible();

    // Navigate to insights
    await page.getByRole("link", { name: "Insights" }).click();
    await expect(page).toHaveURL("/insights");
    await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();

    // Navigate to account
    await page.getByRole("link", { name: "Account" }).click();
    await expect(page).toHaveURL("/account");
    await expect(
      page.getByText(`Hello, ${process.env.E2E_TEST_EMAIL}`),
    ).toBeVisible();
  });
});
