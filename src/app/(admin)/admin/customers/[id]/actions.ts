"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const tierId = String(formData.get("tierId") ?? "") || null;

  if (!companyName) {
    return { error: "Company name is required.", success: false };
  }

  const supabase = await createClient();
  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("profile_id")
    .eq("id", customerId)
    .single();

  if (fetchError || !customer) {
    return { error: "Customer not found.", success: false };
  }

  const { error } = await supabase
    .from("customers")
    .update({ company_name: companyName, phone: phone || null, tier_id: tierId })
    .eq("id", customerId);

  if (error) {
    return { error: error.message, success: false };
  }

  // profiles has no admin-write RLS policy (only "update own"), so this one
  // field goes through the service-role client - same pattern already used
  // for the auth-admin invite call in customers/new/actions.ts. requireAdmin()
  // above is the actual guard; this bypasses RLS deliberately, not by accident.
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) {
    const admin = createAdminClient();
    const { error: profileError } = await admin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", customer.profile_id);

    if (profileError) {
      return { error: `Saved company details, but name update failed: ${profileError.message}`, success: false };
    }
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
