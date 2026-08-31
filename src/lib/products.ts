import { createClient } from "@/lib/supabase/server";
import type { Product, ProductVariant } from "@/types/database";

export interface ProductWithVariants extends Product {
  product_variants: ProductVariant[];
}

interface ListProductsOptions {
  search?: string;
  /** Filters to products tagged with this Shopify tag - see listCatalogTags(). */
  tag?: string;
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
  if (options.tag) {
    query = query.contains("tags", [options.tag]);
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

// Shopify's `product_type` (our `category` column) is unreliable for this
// catalog - Kakawa's Shopify data has it set to structural values like
// "simple"/"variable"/"variation" rather than real category names. Shopify
// `tags`, however, carry meaningful category-like labels (Gift Box,
// Chocolate Slab, Single Origin, ...), so the catalog's category sidebar
// filters by tag instead. Low-frequency one-off tags are noise for a
// sidebar, so only tags used by at least this many visible products
// surface as a filter option.
const MIN_TAG_PRODUCT_COUNT = 3;

/** Tags used by enough visible products to be worth a sidebar filter, most-used first. */
export async function listCatalogTags(): Promise<{ tag: string; count: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("tags")
    .eq("is_b2b_visible", true)
    .returns<{ tags: string[] }[]>();

  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    for (const tag of row.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= MIN_TAG_PRODUCT_COUNT)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Cheapest-variant price bounds across all visible products, for the price range filter. */
export async function getCatalogPriceBounds(): Promise<{ min: number; max: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("b2c_price, products!inner(is_b2b_visible)")
    .eq("products.is_b2b_visible", true)
    .returns<{ b2c_price: number }[]>();

  if (error || !data || data.length === 0) return { min: 0, max: 0 };
  const prices = data.map((v) => v.b2c_price);
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
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

/** All products regardless of visibility (admin-only via RLS). */
export async function listAllProductsForAdmin(): Promise<ProductWithVariants[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .order("title", { ascending: true })
    .returns<ProductWithVariants[]>();

  if (error) {
    console.error("listAllProductsForAdmin failed:", error);
    return [];
  }

  return (data ?? []).map((p) => ({
    ...p,
    product_variants: [...p.product_variants].sort(
      (a, b) => a.b2c_price - b.b2c_price
    ),
  }));
}

/** Single product regardless of visibility (admin-only via RLS). */
export async function getProductForAdmin(
  productId: string
): Promise<ProductWithVariants | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", productId)
    .single<ProductWithVariants>();

  if (error || !data) return null;

  return {
    ...data,
    product_variants: [...data.product_variants].sort(
      (a, b) => a.b2c_price - b.b2c_price
    ),
  };
}
