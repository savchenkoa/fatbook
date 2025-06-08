import { expect, test } from "@playwright/test";

test.describe.serial("Eatings Flow", () => {
  test("should add eating, modify weight, and delete eating", async ({
    page,
  }) => {
    // Navigate to today's eatings page
    await page.goto("/eatings");

    // Should be on today's eatings page
    await expect(page).toHaveURL(/\/eatings\/\d{2}-\w{3}-\d{4}/);

    // Add eating to breakfast
    await page.getByText("Breakfast").click();

    // The breakfast section should expand
    await expect(
      page.getByText("Breakfast").locator("..").locator(".."),
    ).toBeVisible();

    // Click the "+" button to add an eating
    const addButton = page.getByRole("button", {
      name: /log breakfast eating/i,
    });
    await addButton.click();

    // Should navigate to add eatings page
    await expect(page).toHaveURL(
      /\/eatings\/\d{2}-\w{3}-\d{4}\/breakfast\/add/,
    );

    // Helper function to add eating with retry logic for search
    async function addEatingToMeal(
      searchTerm: string,
      portion: string,
      fallbackSearches: string[] = [],
    ) {
      await page.getByPlaceholder("Search dish").fill(searchTerm);
      await page.waitForTimeout(1000); // Wait for search debounce

      let found = false;
      const searches = [searchTerm, ...fallbackSearches];

      for (const search of searches) {
        try {
          if (search !== searchTerm) {
            await page.getByPlaceholder("Search dish").fill(search);
            await page.waitForTimeout(1000);
          }

          // Wait for search results
          await page.waitForSelector("div", { timeout: 5000 });

          // Look for the dish in search results
          const dishLocator = page.getByText(search, { exact: false }).first();
          if (await dishLocator.isVisible({ timeout: 3000 })) {
            await dishLocator.click();
            found = true;
            break;
          }
        } catch (e) {
          console.log(`Could not find ${search}, trying next option...`);
          continue;
        }
      }

      if (!found) {
        // Fallback: click the first visible dish in the search results
        const firstDish = page
          .locator("div")
          .filter({ hasText: /kcal/ })
          .first();
        await firstDish.click();
      }

      // Should open portion size selector
      await expect(page.getByLabel("Portion (g.)")).toBeVisible();

      // Set portion size
      await page.getByLabel("Portion (g.)").fill(portion);

      // Add the eating
      await page.getByRole("button", { name: "Add" }).click();
    }

    // Add a banana to breakfast
    await addEatingToMeal("Banana", "120", ["banana", "fruit"]);

    // Should be back on the add eatings page
    await expect(page).toHaveURL(
      /\/eatings\/\d{2}-\w{3}-\d{4}\/breakfast\/add/,
    );

    // Verify the banana appears in selected items at the top;
    await expect(page.getByRole("listitem").getByText("Banana")).toBeVisible();
    await expect(page.getByText("120 g")).toBeVisible();

    // Go back to the main eatings page
    await page.getByRole("button", { name: /back/i }).click();

    // Should be back on today's eatings page
    await expect(page).toHaveURL(/\/eatings\/\d{2}-\w{3}-\d{4}/);

    // Expand breakfast section to see the added eating
    await page.waitForTimeout(1000);
    await page.getByText("Breakfast").click();

    // Verify the banana eating appears in breakfast
    await expect(page.getByText("Banana")).toBeVisible();
    await expect(page.getByText("120 g")).toBeVisible();

    // Verify that daily totals have been updated (should show some calories/nutrition)
    const dailyTotals = page
      .locator("div")
      .filter({ hasText: /⚡.*kcal/ })
      .first();
    await expect(dailyTotals).toBeVisible();

    // Test modifying the eating weight
    // Click on the banana eating to edit it
    await page.getByText("Banana").click();

    // Should open portion size selector for editing
    await expect(page.getByLabel("Portion (g.)")).toBeVisible();

    // The current portion should be pre-filled
    await expect(page.getByLabel("Portion (g.)")).toHaveValue("120");

    // Change the portion to 150g
    await page.getByLabel("Portion (g.)").fill("150");

    // Save the changes
    await page.getByRole("button", { name: "Save" }).click();

    // Verify the updated portion is displayed
    await expect(page.getByText("150 g")).toBeVisible();

    // Verify the old portion is no longer displayed
    await expect(page.getByText("120 g")).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /delete/i }),
    ).not.toBeVisible();

    // Test deleting the eating
    // Click on the banana eating again to edit it
    await page.getByText("Banana").click();

    // Should open portion size selector
    await expect(page.getByLabel("Portion (g.)")).toBeVisible();

    // Click the delete button
    await page.getByRole("button", { name: /delete/i }).click();

    // The eating should be removed from the breakfast section
    await expect(page.getByText("Banana")).not.toBeVisible();
    await expect(page.getByText("150 g")).not.toBeVisible();

    // Verify that daily totals have been updated (should show lower values or zero)
    // The breakfast section should show "No food recorded" or be empty
    const breakfastSection = page.getByTestId("meal-card-breakfast");
    await expect(breakfastSection.getByText("No food recorded")).toBeVisible();
  });

  test("should add multiple eatings to different meals", async ({ page }) => {
    await page.goto("/eatings");

    // Add eating to lunch
    await page.getByText("Lunch").click();
    const lunchAddButton = page.getByRole("button", {
      name: /log lunch eating/i,
    });
    await lunchAddButton.click();

    await expect(page).toHaveURL(/\/eatings\/\d{2}-\w{3}-\d{4}\/lunch\/add/);

    // Search and add a dish to lunch
    await page.getByPlaceholder("Search dish").fill("Egg");
    await page.waitForTimeout(1000);

    // Click on first egg dish found
    const eggDish = page.getByText("Egg", { exact: false }).first();
    if (await eggDish.isVisible({ timeout: 5000 })) {
      await eggDish.click();
    } else {
      // Fallback to any available dish
      await page.locator("div").filter({ hasText: /kcal/ }).first().click();
    }

    await page.getByLabel("Portion (g.)").fill("100");
    await page.getByRole("button", { name: "Add" }).click();

    // Go back to main page
    await page.getByRole("button", { name: /back/i }).click();

    // Add eating to dinner
    await page.getByText("Dinner").click();
    const dinnerAddButton = page.getByRole("button", {
      name: /log dinner eating/i,
    });
    await dinnerAddButton.click();

    await expect(page).toHaveURL(/\/eatings\/\d{2}-\w{3}-\d{4}\/dinner\/add/);

    // Search and add a dish to dinner
    await page.getByPlaceholder("Search dish").fill("Flour");
    await page.waitForTimeout(1000);

    const flourDish = page.getByText("Flour", { exact: false }).first();
    if (await flourDish.isVisible({ timeout: 5000 })) {
      await flourDish.click();
    } else {
      // Fallback to any available dish
      await page.locator("div").filter({ hasText: /kcal/ }).first().click();
    }

    await page.getByLabel("Portion (g.)").fill("50");
    await page.getByRole("button", { name: "Add" }).click();

    // Go back to main page
    await page.getByRole("button", { name: /back/i }).click();

    // Verify both meals now have eatings
    await page.getByText("Lunch").click();
    await expect(page.getByText("100 g")).toBeVisible();

    await page.getByText("Dinner").click();
    await expect(page.getByText("50 g")).toBeVisible();

    // Verify daily totals show accumulated values
    const dailyTotals = page
      .locator("div")
      .filter({ hasText: /⚡.*kcal/ })
      .first();
    await expect(dailyTotals).toBeVisible();

    // The daily totals should show some meaningful values (not zero)
    await expect(dailyTotals.getByText(/[1-9]\d*.*kcal/).first()).toBeVisible();
  });

  test("should navigate between different days", async ({ page }) => {
    await page.goto("/eatings");

    // Click previous day button
    await page.getByRole("button", { name: /go to one day back/i }).click();

    // Should navigate to previous day
    await expect(page).toHaveURL(/\/eatings\/\d{2}-\w{3}-\d{4}/);

    // Add an eating to yesterday
    await page.getByText("Snack").click();
    const snackAddButton = page.getByRole("button", {
      name: /log snack eating/i,
    });
    await snackAddButton.click();

    // Add a quick snack
    await page.getByPlaceholder("Search dish").fill("Banana");
    await page.waitForTimeout(1000);

    const bananaSnack = page.getByText("Banana", { exact: false }).first();
    if (await bananaSnack.isVisible({ timeout: 5000 })) {
      await bananaSnack.click();
    } else {
      await page.locator("div").filter({ hasText: /kcal/ }).first().click();
    }

    await page.getByLabel("Portion (g.)").fill("80");
    await page.getByRole("button", { name: "Add" }).click();

    // Go back
    await page.getByRole("button", { name: /back/i }).click();

    // Navigate back to today
    await page.getByRole("button", { name: /go to one day forward/i }).click();

    // Should be back to today
    await expect(page).toHaveURL(/\/eatings\/\d{2}-\w{3}-\d{4}/);

    // Today should not show the snack we added to yesterday
    await page.getByText("Snack").click();
    const todaySnackSection = page.getByTestId("meal-card-snack");
    await expect(todaySnackSection.getByText("No food recorded")).toBeVisible();
  });
});
