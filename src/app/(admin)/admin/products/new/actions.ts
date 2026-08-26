"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface CreateProductState {
  error: string | null;
}

export async function createProduct(
  _prevState: CreateProductState,
  formData: FormData
): Promise<CreateProductState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const price = Number(formData.get("price"));
  const weightGrams = formData.get("weightGrams")
    ? Number(formData.get("weightGrams"))
    : null;

  if (!title) return { error: "Product title is required." };
  if (!Number.isFinite(price) || price < 0) {
    return { error: "B2C price must be a non-negative number." };
  }

  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      title,
      category: category || null,
      description: description || null,
      image_url: imageUrl || null,
      is_b2b_visible: true,
      source: "manual",
    })
    .select("id")
    .single();

  if (productError || !product) {
    return { error: `Failed to create product: ${productError?.message}` };
  }

  const { error: variantError } = await supabase.from("product_variants").insert({
    product_id: product.id,
    sku: sku || null,
    b2c_price: price,
    weight_grams: weightGrams,
    is_available: true,
  });

  if (variantError) {
    return { error: `Product created but variant failed: ${variantError.message}` };
  }

  redirect(`/admin/products/${product.id}`);
}
