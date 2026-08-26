/**
 * Creates (or updates) an admin login for manual QA of the admin
 * console. Uses admin.createUser with email_confirm: true, so no
 * invite email is sent and no real inbox is required.
 *
 * Usage: npm run create-test-admin -- <email> <password> ["Full Name"]
 */
import { config } from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

config({ path: ".env.local" });

async function main() {
  const [email, password, fullName = "Kakawa Admin"] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: npm run create-test-admin -- <email> <password> ["Full Name"]');
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingUser = existing?.users.find((u) => u.email === email);

  const { data: authUser, error: authError } = existingUser
    ? { data: { user: existingUser }, error: null }
    : await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "admin", full_name: fullName },
      });

  if (authError || !authUser?.user) {
    console.error("Failed to create auth user:", authError);
    process.exit(1);
  }

  // The handle_new_user() trigger only runs on insert, so an existing
  // user's profile role needs an explicit bump to admin here.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin", full_name: fullName })
    .eq("id", authUser.user.id);

  if (profileError) {
    console.error("Failed to set admin role:", profileError);
    process.exit(1);
  }

  console.log("Test admin ready.");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
