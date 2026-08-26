import { createClient } from "@/lib/supabase/server";
import type { Customer, CustomizationRequest, Tier } from "@/types/database";

export interface CustomerWithTier extends Customer {
  tiers: { id: string; name: string } | null;
  profiles: { email: string; full_name: string | null } | null;
}

/** All customers (admin-only via RLS), newest first. */
export async function listCustomers(): Promise<CustomerWithTier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*, tiers(id, name), profiles(email, full_name)")
    .order("created_at", { ascending: false })
    .returns<CustomerWithTier[]>();

  if (error) {
    console.error("listCustomers failed:", error);
    return [];
  }
  return data ?? [];
}

export async function getCustomer(id: string): Promise<CustomerWithTier | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*, tiers(id, name), profiles(email, full_name)")
    .eq("id", id)
    .single<CustomerWithTier>();

  if (error || !data) return null;
  return data;
}

export async function getCustomerRequestHistory(
  customerId: string
): Promise<(CustomizationRequest & { products: { title: string } | null })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customization_requests")
    .select("*, products(title)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .returns<(CustomizationRequest & { products: { title: string } | null })[]>();

  if (error) {
    console.error("getCustomerRequestHistory failed:", error);
    return [];
  }
  return data ?? [];
}

export async function listActiveTiers(): Promise<Tier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tiers")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .returns<Tier[]>();

  if (error) {
    console.error("listActiveTiers failed:", error);
    return [];
  }
  return data ?? [];
}
