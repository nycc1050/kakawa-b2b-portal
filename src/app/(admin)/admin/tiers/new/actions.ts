"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface CreateTierState {
  error: string | null;
}

export async function createTier(
  _prevState: CreateTierState,
  formData: FormData
): Promise<CreateTierState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const discountPercentInput = Number(formData.get("discountPercent"));

  if (!name) {
    return { error: "Tier name is required." };
  }
  if (!Number.isFinite(discountPercentInput) || discountPercentInput < 0 || discountPercentInput >= 100) {
    return { error: "Base discount must be a number between 0 and 99." };
  }

  const supabase = await createClient();
  const { data: tier, error } = await supabase
    .from("tiers")
    .insert({ name, base_discount_percent: discountPercentInput / 100 })
    .select("id")
    .single();

  if (error || !tier) {
    return { error: error?.message ?? "Failed to create tier." };
  }

  redirect(`/admin/tiers/${tier.id}`);
}
