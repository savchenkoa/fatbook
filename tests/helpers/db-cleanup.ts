import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import invariant from "tiny-invariant";

config({ path: ".env.test" });

invariant(
  process.env.E2E_TEST_EMAIL,
  "E2E_TEST_EMAIL must be set in .env.test",
);
invariant(
  process.env.E2E_TEST_PASSWORD,
  "E2E_TEST_PASSWORD must be set in .env.test",
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
);

async function cleanup() {
  console.log("🧹 Starting database cleanup...");

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.signInWithPassword({
      email: process.env.E2E_TEST_EMAIL!,
      password: process.env.E2E_TEST_PASSWORD!,
    });

    if (authError || !user) {
      console.error(
        "❌ Failed to authenticate for cleanup:",
        authError?.message,
      );
      return;
    }

    console.log(`✅ Authenticated as ${user.email}`);

    // Delete test eatings
    const { error: eatingsError } = await supabase
      .from("eatings")
      .delete()
      .eq("userId", user.id);

    if (eatingsError) {
      console.error("❌ Failed to delete eatings:", eatingsError.message);
    } else {
      console.log("✅ Deleted test eatings");
    }

    // Delete test dishes (only those created by test user)
    const { error: dishesError } = await supabase
      .from("dishes")
      .delete()
      .like("name", "e2e_test%");

    if (dishesError) {
      console.error("❌ Failed to delete dishes:", dishesError.message);
    } else {
      console.log("✅ Deleted test dishes");
    }

    // Sign out
    await supabase.auth.signOut();
    console.log("✅ Database cleanup completed successfully");
  } catch (error) {
    console.error("❌ Cleanup failed with error:", error);
    throw error;
  }
}

cleanup();
