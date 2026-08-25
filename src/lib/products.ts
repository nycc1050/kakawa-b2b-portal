import { createClient } from "@/lib/supabase/server";
import type { Product, ProductVariant } from "@/types/database";

export interface ProductWithVariants extends Product {
  product_variants: ProductVariant[];
}

interface ListProductsOptions {
  search?: string;
  category?: string;
}

/** Visible-to-B2B products, each with its variants, cheapest-priced variant first. */
export async function listVisibleProducts(
  options: ListProductsOptions = {}
): Promise<ProductWithVariants[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("is_b2b_visible", true)
    .order("title", { ascending: true });

  if (options.search) {
    query = query.ilike("title", `%${options.search}%`);
  }
  if (options.category) {
    query = query.eq("category", options.category);
  }

  const { data, error } = await query.returns<ProductWithVariants[]>();
  if (error) {
    console.error("listVisibleProducts failed:", error);
    return [];
  }

  return (data ?? []).map((p) => ({
    ...p,
    product_variants: [...p.product_variants].sort(
      (a, b) => a.b2c_price - b.b2c_price
    ),
  }));
}

/** Distinct categories among visible products, for the catalog filter. */
export async function listCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("is_b2b_visible", true)
    .not("category", "is", null)
    .returns<{ category: string | null }[]>();

  if (error || !data) return [];
  const unique = new Set(
    data.map((r) => r.category).filter((c): c is string => Boolean(c))
  );
  return [...unique].sort();
}

/** Lean id/title list for dropdowns (customization request form). */
export async function listProductOptions(): Promise<
  { id: string; title: string }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, title")
    .eq("is_b2b_visible", true)
    .order("title", { ascending: true })
    .returns<{ id: string; title: string }[]>();

  if (error) {
    console.error("listProductOptions failed:", error);
    return [];
  }
  return data ?? [];
}

export async function getProduct(
  productId: string
): Promise<ProductWithVariants | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", productId)
    .eq("is_b2b_visible", true)
    .single<ProductWithVariants>();

  if (error || !data) return null;

  return {
    ...data,
    product_variants: [...data.product_variants].sort(
      (a, b) => a.b2c_price - b.b2c_price
    ),
  };
}
