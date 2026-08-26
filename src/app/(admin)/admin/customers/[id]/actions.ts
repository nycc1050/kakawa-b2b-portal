"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface UpdateCustomerState {
  error: string | null;
  success: boolean;
}

export async function updateCustomer(
  customerId: string,
  _prevState: UpdateCustomerState,
  formData: FormData
): Promise<UpdateCustomerState> {
  await requireAdmin();

  const companyName = String(formData.get("companyName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const tierId = String(formData.get("tierId") ?? "") || null;

  if (!companyName) {
    return { error: "Company name is required.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ company_name: companyName, phone: phone || null, tier_id: tierId })
    .eq("id", customerId);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
  return { error: null, success: true };
}

export async function toggleCustomerActive(customerId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ is_active: isActive })
    .eq("id", customerId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
}
