/**
 * Seeds baseline reference data for local dev / the Day 7 demo:
 * a couple of pricing tiers with volume rules, and one admin account.
 * Does NOT create test customer accounts (that needs real emails to
 * invite) — use the admin console's "Create Customer" once Day 5 ships,
 * or call inviteTestCustomer() below manually with a real inbox.
 *
 * Usage: npm run seed
 */
import "dotenv/config";
import { createAdminClient } from "../src/lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();

  console.log("Seeding tiers...");
  const tiersToSeed = [
    { name: "Wholesale-Monthly-Tier1", base_discount_percent: 0.4 },
    { name: "Wholesale-Quarterly-Tier2", base_discount_percent: 0.3 },
    { name: "Corporate-Custom", base_discount_percent: 0.25 },
  ];

  for (const t of tiersToSeed) {
    const { data: tier, error } = await supabase
      .from("tiers")
      .upsert(t, { onConflict: "name" })
      .select("id, name")
      .single();

    if (error || !tier) {
      console.error(`Failed to seed tier "${t.name}":`, error);
      continue;
    }

    const { error: volError } = await supabase
      .from("volume_discounts")
      .upsert(
        [
          { tier_id: tier.id, min_quantity: 100, additional_discount_percent: 0.05 },
          { tier_id: tier.id, min_quantity: 500, additional_discount_percent: 0.1 },
        ],
        { onConflict: "tier_id,min_quantity" }
      );
    if (volError) {
      console.error(`Failed to seed volume discounts for "${t.name}":`, volError);
    } else {
      console.log(`  - ${t.name} (${tier.id})`);
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!adminEmail) {
    console.log(
      "SEED_ADMIN_EMAIL not set — skipping admin invite. Set it in .env.local and re-run to invite yourself as admin."
    );
  } else {
    console.log(`Inviting admin account: ${adminEmail} ...`);
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      adminEmail,
      { data: { role: "admin", full_name: "Kakawa Admin" } }
    );
    if (error) {
      console.error("Failed to invite admin:", error.message);
    } else {
      console.log(`Invited ${data.user?.email}. Check inbox to set password.`);
    }
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
