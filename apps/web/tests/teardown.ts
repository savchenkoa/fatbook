import { test as teardown } from "@playwright/test";
import { execSync } from "child_process";
import * as path from "node:path";

teardown("cleanup database", async () => {
  console.log("🧹 Running database cleanup...");

  try {
    // Run the cleanup script
    const cleanupScript = path.join(
      process.cwd(),
      "tests",
      "helpers",
      "db-cleanup.ts",
    );
    execSync(`npx tsx ${cleanupScript}`, {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "test" },
    });
    console.log("✅ Database cleanup completed successfully");
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    // Don't fail the entire test run if cleanup fails
    // throw error; // Uncomment if you want cleanup failures to fail the test run
  }
});
