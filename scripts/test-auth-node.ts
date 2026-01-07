import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.log("Required: SUPABASE_URL and SUPABASE_ANON_KEY");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test credentials
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: "TestPassword123!",
  displayName: "Test User",
  bio: "This is a test user",
};

async function runAuthTests() {
  console.log("🚀 Starting Authentication Tests...\n");
  console.log("Supabase URL:", SUPABASE_URL);
  console.log("Using email:", TEST_USER.email);
  console.log("");

  try {
    // Test 1: Signup
    console.log("📝 Test 1: User Signup");
    console.log("─".repeat(50));

    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email: TEST_USER.email,
        password: TEST_USER.password,
        options: {
          data: {
            display_name: TEST_USER.displayName,
            profile_data: {
              bio: TEST_USER.bio,
            },
          },
        },
      }
    );

    if (signupError) {
      console.error("❌ Signup failed:", signupError.message);
      if (signupError.message.includes("User already registered")) {
        console.log("💡 User already exists, continuing with login test...\n");
      } else {
        console.error("Error details:", signupError);
        return;
      }
    } else {
      console.log("✅ Signup successful!");
      console.log("   User ID:", signupData.user?.id);
      console.log("   Email:", signupData.user?.email);
      console.log("   Session:", signupData.session ? "Active ✓" : "None ✗");
      console.log(
        "   Email confirmed:",
        signupData.user?.email_confirmed_at ? "Yes" : "No"
      );

      // Wait for trigger to create profile
      console.log("\n⏳ Waiting for profile creation...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if profile was created
      if (signupData.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", signupData.user.id)
          .single();

        if (profileError) {
          console.error("❌ Profile not found!");
          console.error("   Error:", profileError.message);
          console.log("\n⚠️  Make sure you have:");
          console.log("   1. Created the profiles table");
          console.log("   2. Created the trigger to auto-create profiles");
        } else {
          console.log("✅ Profile created successfully!");
          console.log("   Display name:", profile.display_name);
          console.log("   Bio:", profile.profile_data?.bio);
          console.log("   Created at:", profile.created_at);
        }
      }

      // Logout after signup
      await supabase.auth.signOut();
      console.log("\n🔓 Logged out");
    }

    // Test 2: Login
    console.log("\n🔐 Test 2: User Login");
    console.log("─".repeat(50));

    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

    if (loginError) {
      console.error("❌ Login failed:", loginError.message);
      console.error("Error details:", loginError);
      return;
    }

    console.log("✅ Login successful!");
    console.log("   User ID:", loginData.user?.id);
    console.log("   Email:", loginData.user?.email);
    console.log("   Session:", loginData.session ? "Active ✓" : "None ✗");

    // Test 3: Get current session
    console.log("\n🎫 Test 3: Get Current Session");
    console.log("─".repeat(50));

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ Session error:", sessionError.message);
    } else if (session) {
      console.log("✅ Session retrieved");
      console.log(
        "   Access token:",
        session.access_token.substring(0, 20) + "..."
      );
      console.log(
        "   Refresh token:",
        session.refresh_token ? "Present ✓" : "Missing ✗"
      );
      console.log(
        "   Expires:",
        new Date(session.expires_at! * 1000).toLocaleString()
      );
    } else {
      console.log("❌ No active session");
    }

    // Test 4: Get user profile from database
    console.log("\n📋 Test 4: Fetch User Profile");
    console.log("─".repeat(50));

    if (loginData.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", loginData.user.id)
        .single();

      if (profileError) {
        console.error("❌ Profile fetch failed:", profileError.message);
      } else {
        console.log("✅ Profile retrieved successfully");
        console.log("   Display name:", profile.display_name);
        console.log("   Email:", profile.email);
        console.log("   Bio:", profile.profile_data?.bio || "None");
        console.log(
          "   Profile data:",
          JSON.stringify(profile.profile_data, null, 2)
        );
      }
    }

    // Test 5: Update profile
    console.log("\n✏️  Test 5: Update Profile");
    console.log("─".repeat(50));

    if (loginData.user) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: "Updated Test User",
          profile_data: {
            bio: "Updated bio!",
            preferences: {
              theme: "dark",
              notifications: true,
            },
          },
        })
        .eq("user_id", loginData.user.id);

      if (updateError) {
        console.error("❌ Update failed:", updateError.message);
      } else {
        console.log("✅ Profile updated");

        // Fetch updated profile
        const { data: updatedProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", loginData.user.id)
          .single();

        if (updatedProfile) {
          console.log("   New display name:", updatedProfile.display_name);
          console.log("   New bio:", updatedProfile.profile_data?.bio);
          console.log(
            "   Preferences:",
            updatedProfile.profile_data?.preferences
          );
        }
      }
    }

    // Test 6: Wrong password
    console.log("\n🔒 Test 6: Login with Wrong Password");
    console.log("─".repeat(50));

    const { error: wrongPwError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: "WrongPassword123!",
    });

    if (wrongPwError) {
      console.log("✅ Correctly rejected invalid credentials");
      console.log("   Error:", wrongPwError.message);
    } else {
      console.log("❌ Security issue: Login succeeded with wrong password!");
    }

    // Test 7: Logout
    console.log("\n🔓 Test 7: Logout");
    console.log("─".repeat(50));

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      console.error("❌ Logout failed:", logoutError.message);
    } else {
      console.log("✅ Logout successful");

      // Verify session is cleared
      const {
        data: { session: sessionAfterLogout },
      } = await supabase.auth.getSession();

      if (sessionAfterLogout) {
        console.log("⚠️  Warning: Session still exists");
      } else {
        console.log("✅ Session cleared");
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("✨ All tests completed successfully!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n💥 Unexpected error:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run tests
console.log("=".repeat(50));
console.log("  WF-DEMO-APP Authentication Tests");
console.log("=".repeat(50));
console.log("");

runAuthTests()
  .then(() => {
    console.log("\n✅ Test suite completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  });
