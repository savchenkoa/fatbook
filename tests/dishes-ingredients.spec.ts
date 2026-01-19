import { expect } from "@playwright/test";
import { expectFoodValueToEqual, getListItem } from "./helpers/food-value-utils";
import { test } from "./fixtures";

// Helper function to search for an ingredient with robust waiting
async function searchAndSelectIngredient(page, ingredientName: string) {
    await page.getByPlaceholder("Search dish").clear();
    await page.getByPlaceholder("Search dish").fill(ingredientName);

    // Wait for search results to load
    await page.waitForLoadState("networkidle");

    // Wait for the specific ingredient to be visible
    const ingredientLocator = page.getByText(ingredientName).first();
    await expect(ingredientLocator).toBeVisible({ timeout: 10000 });

    await ingredientLocator.click();
}

test.describe.serial("Dishes with Ingredients", () => {
    test("should create new dish with ingredients", async ({ page }) => {
        await page.goto("/dishes");

        // Click create button to start creating a new dish
        await page.getByRole("button", { name: /create/i }).click();
        await expect(page).toHaveURL("/dishes/new");

        // Fill in basic dish information
        await page.getByRole("button", { name: "🥫" }).click(); // Select default icon
        await page.getByRole("button", { name: "🥞" }).click(); // Select pancakes icon

        await page.getByLabel("Name").fill("e2e_test Test Pancakes");
        await page.getByLabel("Portion Size").fill("250");

        // Add first ingredient - click "Add ingredient" button
        await page.getByRole("button", { name: /add ingredient/i }).click();
        await expect(page).toHaveURL(/\/dishes\/\d+\/add-ingredients/);

        // Search for and add banana
        await searchAndSelectIngredient(page, "Banana");
        await page.getByLabel("Portion (g.)").fill("150");
        await page.getByRole("button", { name: "Add" }).click();

        // Add second ingredient - search for flour
        await searchAndSelectIngredient(page, "Flour");
        await page.getByLabel("Portion (g.)").fill("100");
        await page.getByRole("button", { name: "Add" }).click();

        // Add third ingredient - search for egg
        await searchAndSelectIngredient(page, "Egg");
        await page.getByLabel("Portion (g.)").fill("100");
        await page.getByRole("button", { name: "Add" }).click();

        // Close the ingredients selector
        await page.getByRole("button", { name: /back/i }).click();
        await page.waitForLoadState("networkidle");

        // Should be back at the dish edit page
        await expect(page).toHaveURL(/\/dishes\/\d+$/);

        // Verify all three ingredients are listed
        await expect(page.getByText("Banana")).toBeVisible();
        await expect(page.getByText("Flour")).toBeVisible();
        await expect(page.getByText("Egg")).toBeVisible();

        // Verify that calculated nutritional values are displayed
        await expect(page.getByLabel("Calories")).toHaveValue("185");
        await expect(page.getByLabel("Proteins")).toHaveValue("6");
        await expect(page.getByLabel("Fats")).toHaveValue("2");
        await expect(page.getByLabel("Carbs")).toHaveValue("31");
    });

    test("should be able to input cooked dish weight", async ({ page }) => {
        await page.goto("/dishes");
        await page.waitForLoadState("networkidle");

        await page.getByText("e2e_test Test Pancakes").click();
        await page.waitForLoadState("networkidle");

        // Test the cooking details feature
        await page.getByRole("button", { name: /cooking menu/i }).click();

        // Set cooked weight to simulate cooking loss (350g total raw weight -> 250g cooked)
        await page.getByLabel("Cooked Weight (g.)").fill("250");
        await page.getByRole("button", { name: "Save" }).click(); // Click the save button (check icon)
        await page.waitForLoadState("networkidle");

        // Close the cooking details dialog
        await page.getByRole("button", { name: "Close" }).first().click();

        // Navigate back to dishes list
        await page.getByRole("button", { name: /back/i }).click();
        await expect(page).toHaveURL("/dishes");
        await page.waitForLoadState("networkidle");

        // Verify the dish appears in the list with updated nutritional info
        await expect(page.getByText("e2e_test Test Pancakes")).toBeVisible();

        // Verify that the dish shows calculated nutritional values in the list
        const dishListItem = await getListItem(page, "e2e_test Test Pancakes");
        await expectFoodValueToEqual(dishListItem, {
            calories: 259,
            proteins: 8,
            fats: 3,
            carbs: 43,
        });
    });

    test("should be able to edit ingredient portions", async ({ page }) => {
        await page.goto("/dishes");

        // Find the test dish we created
        await page.getByText("e2e_test Test Pancakes").click();

        // Click on one of the ingredients to edit it
        await page.getByText("Banana").click();

        // Change the portion size
        await page.getByLabel("Portion (g.)").fill("200");
        await page.getByRole("button", { name: "Save" }).click();

        // Verify the ingredient list updated
        await expect(page.getByText("200 g")).toBeVisible();

        // Verify food value recalculated
        await expect(page.getByLabel("Calories")).toHaveValue("173");
        await expect(page.getByLabel("Proteins")).toHaveValue("5");
        await expect(page.getByLabel("Fats")).toHaveValue("2");
        await expect(page.getByLabel("Carbs")).toHaveValue("30");
    });

    test("should be able to remove ingredients", async ({ page }) => {
        await page.goto("/dishes");

        // Find the test dish
        await page.getByText("e2e_test Test Pancakes").click();

        // Click on an ingredient to edit
        await page.getByText("Flour").click();

        // Delete the ingredient
        await page.getByRole("button", { name: /delete/i }).click();

        // Verify the ingredient was removed
        await expect(page.getByText("Flour")).not.toBeVisible();

        // Verify food value recalculated
        await expect(page.getByLabel("Calories")).toHaveValue("112");
        await expect(page.getByLabel("Proteins")).toHaveValue("3");
        await expect(page.getByLabel("Fats")).toHaveValue("2");
        await expect(page.getByLabel("Carbs")).toHaveValue("16");
    });
});
