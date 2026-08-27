import { createClient } from "@/lib/supabase/server";
import type { CustomizationRequest, RequestStatus } from "@/types/database";

const LOGO_BUCKET = "customization-logos";
const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes - regenerated per view, not stored

export interface CustomizationRequestWithProduct extends CustomizationRequest {
  products: { title: string } | null;
}

export interface CustomizationRequestForAdmin extends CustomizationRequest {
  products: { title: string } | null;
  customers: { company_name: string; profiles: { email: string } | null } | null;
}

/** Requests visible to the current session (RLS scopes this to "own rows" for customers, all rows for admin). */
export async function listMyRequests(): Promise<CustomizationRequestWithProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customization_requests")
    .select("*, products(title)")
    .order("created_at", { ascending: false })
    .returns<CustomizationRequestWithProduct[]>();

  if (error) {
    console.error("listMyRequests failed:", error);
    return [];
  }
  return data ?? [];
}

export async function getRequest(
  id: string
): Promise<CustomizationRequestWithProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customization_requests")
    .select("*, products(title)")
    .eq("id", id)
    .single<CustomizationRequestWithProduct>();

  if (error || !data) return null;
  return data;
}

/** All requests regardless of owner (admin-only via RLS), newest first, optionally filtered by status. */
export async function listAllRequestsForAdmin(
  status?: RequestStatus
): Promise<CustomizationRequestForAdmin[]> {
  const supabase = await createClient();
  let query = supabase
    .from("customization_requests")
    .select("*, products(title), customers(company_name, profiles(email))")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<CustomizationRequestForAdmin[]>();
  if (error) {
    console.error("listAllRequestsForAdmin failed:", error);
    return [];
  }
  return data ?? [];
}

/** Single request regardless of owner (admin-only via RLS). */
export async function getRequestForAdmin(
  id: string
): Promise<CustomizationRequestForAdmin | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customization_requests")
    .select("*, products(title), customers(company_name, profiles(email))")
    .eq("id", id)
    .single<CustomizationRequestForAdmin>();

  if (error || !data) return null;
  return data;
}

/** Generates a short-lived signed URL for a private logo upload. Returns null if there's no logo or generation fails. */
export async function getLogoSignedUrl(
  path: string | null
): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(LOGO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("getLogoSignedUrl failed:", error);
    return null;
  }
  return data.signedUrl;
}

export { LOGO_BUCKET };
