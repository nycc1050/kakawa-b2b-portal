import { createClient } from "@/lib/supabase/server";
import type { Tier, VolumeDiscount } from "@/types/database";

export interface TierWithCount extends Tier {
  customerCount: number;
}

export async function listTiersWithCounts(): Promise<TierWithCount[]> {
  const supabase = await createClient();
  const [{ data: tiers, error }, { data: customers }] = await Promise.all([
    supabase.from("tiers").select("*").order("name", { ascending: true }).returns<Tier[]>(),
    supabase.from("customers").select("tier_id").returns<{ tier_id: string | null }[]>(),
  ]);

  if (error) {
    console.error("listTiersWithCounts failed:", error);
    return [];
  }

  const counts = new Map<string, number>();
  for (const c of customers ?? []) {
    if (!c.tier_id) continue;
    counts.set(c.tier_id, (counts.get(c.tier_id) ?? 0) + 1);
  }

  return (tiers ?? []).map((t) => ({ ...t, customerCount: counts.get(t.id) ?? 0 }));
}

export interface TierWithVolumeDiscounts extends Tier {
  volume_discounts: VolumeDiscount[];
}

export async function getTier(id: string): Promise<TierWithVolumeDiscounts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tiers")
    .select("*, volume_discounts(*)")
    .eq("id", id)
    .single<TierWithVolumeDiscounts>();

  if (error || !data) return null;

  return {
    ...data,
    volume_discounts: [...data.volume_discounts].sort(
      (a, b) => a.min_quantity - b.min_quantity
    ),
  };
}
