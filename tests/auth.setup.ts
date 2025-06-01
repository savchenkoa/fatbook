import { test as setup, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import invariant from "tiny-invariant";

invariant(
  process.env.E2E_TEST_EMAIL,
  "E2E_TEST_EMAIL must be set in .env.test",
);
invariant(
  process.env.E2E_TEST_PASSWORD,
  "E2E_TEST_PASSWORD must be set in .env.test",
);

setup("authenticate", async ({ page, context }) => {
  // Ensure auth directory exists
  const authDir = path.join(process.cwd(), "tests", ".auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Get credentials from environment
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  console.log(`Authenticating with test user: ${email}`);

  // Navigate to the login page
  await page.goto("/login");

  // Wait for the test login form to be visible
  await expect(page.getByTestId("test-email-input")).toBeVisible({
    timeout: 10000,
  });

  // Fill in the test login form
  await page.getByTestId("test-email-input").fill(email);
  await page.getByTestId("test-password-input").fill(password);

  // Submit the form
  await page.getByTestId("test-login-button").click();

  // Wait for successful login - should redirect to main app
  await expect(page).toHaveURL(/\/eatings\//, { timeout: 15000 });

  // Wait for the user to be fully loaded
  await expect(page.getByText(email)).toBeVisible({ timeout: 10000 });

  // Save the storage state
  await context.storageState({ path: "tests/.auth/user.json" });

  console.log("✓ Authentication setup completed using test form");
});
