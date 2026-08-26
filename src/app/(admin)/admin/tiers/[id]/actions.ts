"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface UpdateTierState {
  error: string | null;
  success: boolean;
}

export async function updateTier(
  tierId: string,
  _prevState: UpdateTierState,
  formData: FormData
): Promise<UpdateTierState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const discountPercentInput = Number(formData.get("discountPercent"));
  const isActive = formData.get("isActive") === "on";

  if (!name) return { error: "Tier name is required.", success: false };
  if (!Number.isFinite(discountPercentInput) || discountPercentInput < 0 || discountPercentInput >= 100) {
    return { error: "Base discount must be a number between 0 and 99.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tiers")
    .update({
      name,
      base_discount_percent: discountPercentInput / 100,
      is_active: isActive,
    })
    .eq("id", tierId);

  if (error) return { error: error.message, success: false };

  revalidatePath(`/admin/tiers/${tierId}`);
  revalidatePath("/admin/tiers");
  return { error: null, success: true };
}

export async function addVolumeDiscount(tierId: string, formData: FormData) {
  await requireAdmin();

  const minQuantity = Number(formData.get("minQuantity"));
  const additionalPercentInput = Number(formData.get("additionalPercent"));

  if (!Number.isFinite(minQuantity) || minQuantity <= 0) {
    throw new Error("Min quantity must be a positive number.");
  }
  if (
    !Number.isFinite(additionalPercentInput) ||
    additionalPercentInput <= 0 ||
    additionalPercentInput >= 100
  ) {
    throw new Error("Additional discount must be a number between 1 and 99.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("volume_discounts").insert({
    tier_id: tierId,
    min_quantity: Math.floor(minQuantity),
    additional_discount_percent: additionalPercentInput / 100,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/tiers/${tierId}`);
}

export async function removeVolumeDiscount(tierId: string, volumeDiscountId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("volume_discounts")
    .delete()
    .eq("id", volumeDiscountId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/tiers/${tierId}`);
}
