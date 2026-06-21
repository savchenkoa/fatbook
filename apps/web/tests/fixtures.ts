import { test as base } from "@playwright/test";
import { completeTutorial } from "./helpers/complete-tutorial";

export const test = base.extend<{ forEachTest: void }>({
    forEachTest: [
        async ({ page }, use) => {
            // This code runs before every test.
            await page.goto("/");

            await completeTutorial(page);
            await use();
        },
        { auto: true },
    ], // automatically starts for every test.
});
