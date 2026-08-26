"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CreateCustomerState {
  error: string | null;
}

export async function createCustomer(
  _prevState: CreateCustomerState,
  formData: FormData
): Promise<CreateCustomerState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const tierId = String(formData.get("tierId") ?? "") || null;

  if (!email || !companyName) {
    return { error: "Email and company name are required." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // Reuse an existing profile if this email was already invited before
  // (e.g. a retry), rather than erroring on Supabase's duplicate-user
  // rejection.
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let profileId = existingProfile?.id;

  if (!profileId) {
    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: { role: "customer", full_name: fullName || companyName },
      });
    if (inviteError || !invited?.user) {
      return { error: `Failed to invite customer: ${inviteError?.message}` };
    }
    profileId = invited.user.id;
  }

  const { error: customerError } = await supabase.from("customers").insert({
    profile_id: profileId,
    company_name: companyName,
    tier_id: tierId,
    is_active: true,
  });

  if (customerError) {
    return { error: `Failed to create customer record: ${customerError.message}` };
  }

  redirect("/admin/customers");
}
