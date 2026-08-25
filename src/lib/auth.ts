import { createClient } from "@/lib/supabase/server";
import type { Customer, Profile, Tier, VolumeDiscount } from "@/types/database";

/**
 * Loads the current user's profile (+ customer/tier if applicable).
 * Returns null if unauthenticated — callers in guarded layouts should
 * treat null as unreachable (middleware already redirects), but check
 * anyway for direct server-side calls.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) return null;

  if (profile.role === "admin") {
    return { profile, customer: null, tier: null, volumeDiscounts: [] };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("profile_id", user.id)
    .single<Customer>();

  let tier: Tier | null = null;
  let volumeDiscounts: VolumeDiscount[] = [];
  if (customer?.tier_id) {
    const [{ data: tierData }, { data: volData }] = await Promise.all([
      supabase.from("tiers").select("*").eq("id", customer.tier_id).single<Tier>(),
      supabase
        .from("volume_discounts")
        .select("*")
        .eq("tier_id", customer.tier_id)
        .order("min_quantity", { ascending: true })
        .returns<VolumeDiscount[]>(),
    ]);
    tier = tierData;
    volumeDiscounts = volData ?? [];
  }

  return { profile, customer: customer ?? null, tier, volumeDiscounts };
}
