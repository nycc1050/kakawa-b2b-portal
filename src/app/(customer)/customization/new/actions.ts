"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { LOGO_BUCKET } from "@/lib/customization";

export interface SubmitRequestState {
  error: string | null;
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5MB

export async function submitCustomizationRequest(
  _prevState: SubmitRequestState,
  formData: FormData
): Promise<SubmitRequestState> {
  const session = await getCurrentUser();
  if (!session?.customer) {
    return { error: "You need a customer account to submit a request." };
  }

  const productId = String(formData.get("productId") ?? "");
  const colorPreferences = String(formData.get("colorPreferences") ?? "").trim();
  const embossingDetails = String(formData.get("embossingDetails") ?? "").trim();
  const specialInstructions = String(
    formData.get("specialInstructions") ?? ""
  ).trim();
  const estimatedQuantityRaw = formData.get("estimatedQuantity");
  const estimatedQuantity = estimatedQuantityRaw
    ? Math.max(1, parseInt(String(estimatedQuantityRaw), 10) || 0) || null
    : null;
  const logo = formData.get("logo");

  if (!productId) {
    return { error: "Please select a product." };
  }
  if (!colorPreferences && !embossingDetails && !specialInstructions) {
    return {
      error:
        "Tell us at least one of: color preferences, embossing details, or special instructions.",
    };
  }

  const supabase = await createClient();
  let logoFileUrl: string | null = null;

  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES) {
      return { error: "Logo file is too large (5MB max)." };
    }
    const safeName = logo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${session.customer.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, logo, { contentType: logo.type || undefined });

    if (uploadError) {
      return { error: `Logo upload failed: ${uploadError.message}` };
    }
    logoFileUrl = path;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("customization_requests")
    .insert({
      customer_id: session.customer.id,
      product_id: productId,
      estimated_quantity: estimatedQuantity,
      color_preferences: colorPreferences || null,
      logo_file_url: logoFileUrl,
      embossing_details: embossingDetails || null,
      special_instructions: specialInstructions || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { error: `Failed to submit request: ${insertError?.message}` };
  }

  // "Include in quote?" is a soft link with no schema change - recorded
  // client-side (see customization-links.ts) once we land on the detail
  // page, using the productId/flag carried through this redirect.
  const includeInQuote = formData.get("includeInQuote") === "yes";
  const linkParams = includeInQuote ? `&linkedToQuote=1&productId=${productId}` : "";
  redirect(`/customization/${inserted.id}?submitted=1${linkParams}`);
}
