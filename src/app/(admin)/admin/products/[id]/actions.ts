"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface UpdateProductState {
  error: string | null;
  success: boolean;
}

export async function updateProduct(
  productId: string,
  _prevState: UpdateProductState,
  formData: FormData
): Promise<UpdateProductState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!title) return { error: "Product title is required.", success: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      title,
      category: category || null,
      description: description || null,
      image_url: imageUrl || null,
    })
    .eq("id", productId);

  if (error) return { error: error.message, success: false };

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  return { error: null, success: true };
}

export async function addVariant(productId: string, formData: FormData) {
  await requireAdmin();

  const variantTitle = String(formData.get("variantTitle") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const price = Number(formData.get("price"));
  const weightGrams = formData.get("weightGrams")
    ? Number(formData.get("weightGrams"))
    : null;

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a non-negative number.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    variant_title: variantTitle || null,
    sku: sku || null,
    b2c_price: price,
    weight_grams: weightGrams,
    is_available: true,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalog");
}

export async function updateVariant(productId: string, formData: FormData) {
  await requireAdmin();

  const variantId = String(formData.get("variantId") ?? "");
  const price = Number(formData.get("price"));
  const isAvailable = formData.get("isAvailable") === "on";

  if (!variantId) throw new Error("Missing variant id.");
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a non-negative number.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_variants")
    .update({ b2c_price: price, is_available: isAvailable })
    .eq("id", variantId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalog");
}

export async function removeVariant(productId: string, variantId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalog");
}
