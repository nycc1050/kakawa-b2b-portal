/**
 * Shared Shopify catalog sync logic - pulls Kakawa's live storefront
 * catalog and upserts it into products / product_variants. Idempotent,
 * matches on shopify_product_id / shopify_variant_id, so re-running just
 * refreshes prices/availability rather than duplicating rows.
 *
 * Used by both scripts/scrape-shopify.ts (npm run scrape, for local/CI
 * use) and the admin console's "Sync from Shopify" button
 * (src/app/(admin)/admin/products/actions.ts) - one implementation, two
 * entry points.
 */
import { createAdminClient } from "@/lib/supabase/admin";

const STORE_URL = "https://kakawachocolates.com.au";

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string;
  price: string;
  weight: number;
  available: boolean;
}

interface ShopifyImage {
  src: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  body_html: string;
  tags: string[] | string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

export interface ShopifySyncResult {
  fetchedProducts: number;
  productsUpserted: number;
  variantsUpserted: number;
  errors: string[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTags(tags: string[] | string): string[] {
  if (Array.isArray(tags)) return tags;
  if (!tags) return [];
  return tags.split(",").map((t) => t.trim());
}

async function fetchAllProducts(): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250; // Shopify's max page size for products.json

  while (true) {
    const res = await fetch(`${STORE_URL}/products.json?limit=${limit}&page=${page}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Shopify fetch failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as ShopifyProductsResponse;
    if (data.products.length === 0) break;
    all.push(...data.products);
    if (data.products.length < limit) break;
    page += 1;
  }

  return all;
}

export async function syncShopifyProducts(): Promise<ShopifySyncResult> {
  const products = await fetchAllProducts();

  const supabase = createAdminClient();
  const result: ShopifySyncResult = {
    fetchedProducts: products.length,
    productsUpserted: 0,
    variantsUpserted: 0,
    errors: [],
  };

  for (const sp of products) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .upsert(
        {
          shopify_product_id: sp.id,
          title: sp.title,
          handle: sp.handle,
          category: sp.product_type || null,
          description: stripHtml(sp.body_html || ""),
          image_url: sp.images?.[0]?.src ?? null,
          tags: normalizeTags(sp.tags),
          source: "scraped",
        },
        { onConflict: "shopify_product_id" }
      )
      .select("id")
      .single();

    if (productError || !product) {
      result.errors.push(`"${sp.title}": ${productError?.message ?? "unknown error"}`);
      continue;
    }
    result.productsUpserted += 1;

    for (const v of sp.variants) {
      const { error: variantError } = await supabase.from("product_variants").upsert(
        {
          product_id: product.id,
          shopify_variant_id: v.id,
          variant_title: v.title === "Default Title" ? null : v.title,
          sku: v.sku || null,
          b2c_price: parseFloat(v.price),
          weight_grams: v.weight || null,
          is_available: v.available,
        },
        { onConflict: "shopify_variant_id" }
      );

      if (variantError) {
        result.errors.push(`"${sp.title}" / "${v.title}": ${variantError.message}`);
        continue;
      }
      result.variantsUpserted += 1;
    }
  }

  return result;
}
