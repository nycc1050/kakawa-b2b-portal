"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { syncShopifyProducts, type ShopifySyncResult } from "@/lib/shopify-sync";

export async function toggleProductVisibility(productId: string, visible: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_b2b_visible: visible })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalog");
}

/** Re-runs the same import the Shopify scraper (npm run scrape) does, on demand. */
export async function syncShopifyCatalog(): Promise<ShopifySyncResult> {
  await requireAdmin();
  const result = await syncShopifyProducts();

  revalidatePath("/admin/products");
  revalidatePath("/catalog");

  return result;
}
