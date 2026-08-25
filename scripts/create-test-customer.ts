/**
 * Creates (or updates) a test customer account for manual QA — useful
 * before the admin console's "Create Customer" flow ships on Day 5.
 * Uses admin.createUser with email_confirm: true, so no invite email
 * is sent and no real inbox is required.
 *
 * Usage: npm run create-test-customer -- <email> <password> "<Company Name>" [tierName]
 * Defaults: tierName = "Wholesale-Monthly-Tier1"
 */
import { config } from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

config({ path: ".env.local" });

async function main() {
  const [email, password, companyName, tierName = "Wholesale-Monthly-Tier1"] =
    process.argv.slice(2);

  if (!email || !password || !companyName) {
    console.error(
      'Usage: npm run create-test-customer -- <email> <password> "<Company Name>" [tierName]'
    );
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: tier, error: tierError } = await supabase
    .from("tiers")
    .select("id, name")
    .eq("name", tierName)
    .single();

  if (tierError || !tier) {
    console.error(`Tier "${tierName}" not found. Run npm run seed first.`);
    process.exit(1);
  }

  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingUser = existing?.users.find((u) => u.email === email);

  const { data: authUser, error: authError } = existingUser
    ? { data: { user: existingUser }, error: null }
    : await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "customer", full_name: companyName },
      });

  if (authError || !authUser?.user) {
    console.error("Failed to create auth user:", authError);
    process.exit(1);
  }

  const { error: customerError } = await supabase.from("customers").upsert(
    {
      profile_id: authUser.user.id,
      company_name: companyName,
      tier_id: tier.id,
      is_active: true,
    },
    { onConflict: "profile_id" }
  );

  if (customerError) {
    console.error("Failed to upsert customer row:", customerError);
    process.exit(1);
  }

  console.log(`Test customer ready.`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Company:  ${companyName}`);
  console.log(`  Tier:     ${tier.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
