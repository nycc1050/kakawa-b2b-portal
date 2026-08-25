// NOTE: deliberately NOT importing the `server-only` package here. It
// throws unconditionally under plain Node (e.g. `tsx scripts/seed.ts`),
// which is exactly how this module gets used outside of Next's
// request lifecycle. The `typeof window` check below gives the same
// "never in the browser" guarantee without breaking standalone scripts.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY.
 *
 * Server-only (route handlers / server actions / scripts) — never
 * import from a client component. Used for admin-only privileged
 * operations: inviting customer accounts (auth.admin.inviteUserByEmail)
 * and the Shopify scraper's upsert into products/product_variants.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() must never be called in the browser — it holds the service_role key."
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
