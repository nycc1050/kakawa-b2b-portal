"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { RequestStatus } from "@/types/database";

export interface UpdateRequestState {
  error: string | null;
  success: boolean;
}

const VALID_STATUSES: RequestStatus[] = [
  "submitted",
  "in-review",
  "approved",
  "ready-to-order",
];

export async function updateRequestStatus(
  requestId: string,
  _prevState: UpdateRequestState,
  formData: FormData
): Promise<UpdateRequestState> {
  await requireAdmin();

  const status = String(formData.get("status") ?? "") as RequestStatus;
  const adminNotes = String(formData.get("adminNotes") ?? "").trim();

  if (!VALID_STATUSES.includes(status)) {
    return { error: "Invalid status.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customization_requests")
    .update({ status, admin_notes: adminNotes || null })
    .eq("id", requestId);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  return { error: null, success: true };
}
