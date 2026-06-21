import { expect } from "@playwright/test";
import { expectFoodValueToEqual, getListItem } from "./helpers/food-value-utils";
import { test } from "./fixtures";

test.describe.serial("Simple Dishes Management", () => {
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
        await page.getByLabel("Name").fill("e2e_test Test Pizza");
        await page.getByLabel("Portion Size").fill("250");
        await page.getByLabel("Calories").fill("320");
        await page.getByLabel("Proteins").fill("15");
        await page.getByLabel("Fats").fill("12");
        await page.getByLabel("Carbs").fill("40");

        // Save and go back
        await page.getByRole("button", { name: "Save" }).click();
        await page.getByRole("button", { name: /back/i }).click();

        // Should redirect back to dishes list
        await expect(page).toHaveURL("/dishes");

        // Search for the dish to verify it was created
        await page.getByPlaceholder("Search dish").fill("e2e_test Test Pizza");

        // Verify the dish appears in the list
        await expect(page.getByText("e2e_test Test Pizza").first()).toBeVisible();
        const dishListItem = await getListItem(page, "e2e_test Test Pizza");
        await expectFoodValueToEqual(dishListItem, {
            calories: 320,
            proteins: 15,
            fats: 12,
            carbs: 40,
        });
    });

    test("should update a simple dish", async ({ page }) => {
        await page.goto("/dishes");

        // Search for the dish we created
        await page.getByPlaceholder("Search dish").fill("e2e_test Test Pizza");
        await page.waitForTimeout(500); // Wait for search debounce

        // Click on the dish to edit it
        await page.getByText("e2e_test Test Pizza").click();

        // Should navigate to the dish edit page
        await expect(page).toHaveURL(/\/dishes\/\d+$/);

        // Update the dish name
        await page.getByLabel("Name").fill("e2e_test Updated Pizza");

        // Update nutritional values
        await page.getByLabel("Calories").fill("350");
        await page.getByLabel("Proteins").fill("18");
        await page.getByLabel("Fats").fill("14");
        await page.getByLabel("Carbs").fill("42");

        // Update portion size
        await page.getByLabel("Portion Size").fill("300");

        // Save changes
        await page.getByRole("button", { name: "Save" }).click();
        await expect(page.getByTestId("save-success")).toBeVisible();

        // Go back to dishes list
        await page.getByRole("button", { name: /back/i }).click();

        // Should redirect back to dishes list
        await expect(page).toHaveURL("/dishes");

        // Search for the updated dish
        await page.getByPlaceholder("Search dish").fill("Pizza");
        await page.waitForTimeout(500);

        // Verify the updated dish appears in the list
        await expect(page.getByText("e2e_test Updated Pizza").first()).toBeVisible();

        // Verify the updated nutritional values are displayed
        const dishListItem = await getListItem(page, "e2e_test Updated Pizza");
        await expectFoodValueToEqual(dishListItem, {
            calories: 350,
            proteins: 18,
            fats: 14,
            carbs: 42,
        });
    });

    test("should delete a simple dish", async ({ page }) => {
        await page.goto("/dishes");

        // Search for the dish we want to delete
        await page.getByPlaceholder("Search dish").fill("e2e_test Updated Pizza");
        await page.waitForTimeout(500);

        // Click on the dish to open it
        await page.getByText("e2e_test Updated Pizza").click();

        // Should navigate to the dish edit page
        await expect(page).toHaveURL(/\/dishes\/\d+$/);

        // Click on the dropdown menu (three dots)
        await page.getByRole("button", { name: /actions/i }).click();

        // Handle the confirmation dialog
        page.on("dialog", (dialog) => {
            expect(dialog.message()).toContain("Please confirm you want to delete this record");
            dialog.accept();
        });

        // Click delete option
        await page.getByRole("menuitem", { name: /delete/i }).click();

        // Should redirect back to dishes list after deletion
        await expect(page).toHaveURL("/dishes");

        // Search for the deleted dish to verify it's gone
        await page.getByPlaceholder("Search dish").fill("e2e_test Updated Pizza");
        await page.waitForTimeout(500);

        // Verify the dish no longer appears in the list
        await expect(page.getByText("e2e_test Updated Pizza")).not.toBeVisible();

        // Clear search to show all dishes
        await page.getByPlaceholder("Search dish").fill("");
        await page.waitForTimeout(500);

        // Verify the dish is not in the full list either
        await expect(page.getByText("e2e_test Updated Pizza")).not.toBeVisible();
    });

    test("should not allow deletion of shared dishes", async ({ page }) => {
        await page.goto("/dishes");

        // Search for a shared dish (these come from seed data)
        await page.getByPlaceholder("Search dish").fill("Egg");
        await page.waitForTimeout(500);

        // Click on the shared dish
        await page.getByText("Egg").first().click();

        // Should navigate to the dish page
        await expect(page).toHaveURL(/\/dishes\/\d+$/);

        // Try to click the dropdown menu
        await page.getByRole("button", { name: /actions/i }).click();

        // Verify that delete option is not available for shared dishes
        // (The delete option should not be present in the dropdown)
        await expect(page.getByRole("menuitem", { name: /delete/i })).not.toBeVisible();

        // Verify there's a copy option instead
        await expect(page.getByRole("menuitem", { name: /clone/i })).toBeVisible();
    });
});
