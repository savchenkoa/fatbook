import { expect, Locator, Page } from "@playwright/test";

/**
 * Food value structure representing nutritional information
 */
export interface FoodValue {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

/**
 * Checks if the food value displayed in the UI matches the expected values
 *
 * @param container - The container locator where food values are displayed
 * @param expectedValues - The expected food values to check against
 */
export async function expectFoodValueToEqual(
  container: Locator,
  expectedValues: FoodValue,
): Promise<void> {
  // Check calories
  await expect(container.getByText(/⚡.*kcal/)).toContainText(
    expectedValues.calories.toString(),
  );

  // Check proteins
  await expect(container.getByText(/🥩.*g/)).toContainText(
    expectedValues.proteins.toString(),
  );

  // Check fats
  await expect(container.getByText(/🧈.*g/)).toContainText(
    expectedValues.fats.toString(),
  );

  // Check carbs
  await expect(container.getByText(/🍚.*g/)).toContainText(
    expectedValues.carbs.toString(),
  );
}

export async function getListItem(page: Page, name: string): Promise<Locator> {
  return page.locator(`text=${name}`).locator("..").locator("..");
}
