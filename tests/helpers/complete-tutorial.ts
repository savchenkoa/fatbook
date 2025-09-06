import { Page } from "@playwright/test";

export async function completeTutorial(page: Page) {
    // Mark the tutorial as completed in localStorage to prevent it from showing
    await page.evaluate(() => {
        localStorage.setItem("fatbook-completed-tutorials", JSON.stringify(["app-intro"]));
    });

    // If the tutorial dialog is still visible, close it
    const dialogExists = await page.locator('[role="dialog"]').count();
    if (dialogExists > 0) {
        // Try to close via X button or ESC key
        const closeButton = page.getByRole("button", { name: "Close" });
        if (await closeButton.isVisible()) {
            await closeButton.click();
        } else {
            // Fallback to ESC key
            await page.keyboard.press("Escape");
        }
    }
}
