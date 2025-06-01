import { test, expect } from "@playwright/test";

test.describe("Dishes Management", () => {
  test("should create a new dish", async ({ page }) => {
    await page.goto("/dishes");

    // Click create button
    await page.getByRole("button", { name: /create/i }).click();

    // Wait for navigation
    await expect(page).toHaveURL("/dishes/new");

    // Select an icon
    await page.getByRole("button", { name: "🥫" }).click();
    await page.getByRole("button", { name: "🍕" }).click();

    // Fill the form
    await page.getByLabel("Name").fill("E2E Test Pizza");
    await page.getByLabel("Portion Size").fill("250");
    await page.getByLabel("Calorie (kcal)").fill("320");
    await page.getByLabel("Protein (g)").fill("15");
    await page.getByLabel("Fat (g)").fill("12");
    await page.getByLabel("Carbs (g)").fill("40");

    // Save
    await page.getByRole("button", { name: "Save" }).click();

    // Should redirect back to dishes list
    await expect(page).toHaveURL("/dishes");

    // Search for a dish
    await page.getByPlaceholder("Search dish").fill("Pizza");

    // Verify the dish appears in the list
    await expect(page.getByText("E2E Test Pizza")).toBeVisible();
  });
});
