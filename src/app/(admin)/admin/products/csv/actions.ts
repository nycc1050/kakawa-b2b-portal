"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Locked columns (docs/build-plan.md decision #3): title, sku, category,
// b2c_price, variant_title, weight.
export interface ProductCsvRow {
  title: string;
  sku: string;
  category: string;
  b2c_price: string;
  variant_title: string;
  weight: string;
}

export interface CsvUploadResult {
  productsCreated: number;
  productsMatched: number;
  variantsCreated: number;
  variantsUpdated: number;
  errors: string[];
}

export async function uploadProductsCsv(
  rows: ProductCsvRow[]
): Promise<CsvUploadResult> {
  await requireAdmin();
  const supabase = await createClient();

  const result: CsvUploadResult = {
    productsCreated: 0,
    productsMatched: 0,
    variantsCreated: 0,
    variantsUpdated: 0,
    errors: [],
  };

  // Group rows by title (case-insensitive) so multiple rows for the
  // same product become multiple variants under one product, matching
  // how the Shopify scraper groups variants.
  const groups = new Map<string, { title: string; category: string; rows: ProductCsvRow[] }>();
  for (const [i, row] of rows.entries()) {
    const title = row.title?.trim();
    if (!title) {
      result.errors.push(`Row ${i + 2}: missing title, skipped.`);
      continue;
    }
    const price = Number(row.b2c_price);
    if (!row.b2c_price || !Number.isFinite(price) || price < 0) {
      result.errors.push(
        `Row ${i + 2} ("${title}"): invalid b2c_price "${row.b2c_price}", skipped.`
      );
      continue;
    }
    const key = title.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { title, category: row.category?.trim() ?? "", rows: [] });
    }
    groups.get(key)!.rows.push(row);
  }

  for (const group of groups.values()) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .ilike("title", group.title)
      .maybeSingle();

    let productId = existing?.id;

    if (!productId) {
      const { data: created, error: createError } = await supabase
        .from("products")
        .insert({
          title: group.title,
          category: group.category || null,
          source: "manual",
          is_b2b_visible: true,
        })
        .select("id")
        .single();

      if (createError || !created) {
        result.errors.push(
          `"${group.title}": failed to create product - ${createError?.message}`
        );
        continue;
      }
      productId = created.id;
      result.productsCreated += 1;
    } else {
      result.productsMatched += 1;
    }

    for (const row of group.rows) {
      const price = Number(row.b2c_price);
      const weight = row.weight ? Number(row.weight) : null;
      const sku = row.sku?.trim() || null;
      const variantTitle = row.variant_title?.trim() || null;

      const existingVariant = sku
        ? (
            await supabase
              .from("product_variants")
              .select("id")
              .eq("product_id", productId)
              .eq("sku", sku)
              .maybeSingle()
          ).data
        : null;

      if (existingVariant) {
        const { error: updateError } = await supabase
          .from("product_variants")
          .update({
            variant_title: variantTitle,
            b2c_price: price,
            weight_grams: Number.isFinite(weight) ? weight : null,
          })
          .eq("id", existingVariant.id);

        if (updateError) {
          result.errors.push(`"${group.title}" / ${sku}: update failed - ${updateError.message}`);
        } else {
          result.variantsUpdated += 1;
        }
      } else {
        const { error: insertError } = await supabase.from("product_variants").insert({
          product_id: productId,
          sku,
          variant_title: variantTitle,
          b2c_price: price,
          weight_grams: Number.isFinite(weight) ? weight : null,
          is_available: true,
        });

        if (insertError) {
          result.errors.push(`"${group.title}": variant insert failed - ${insertError.message}`);
        } else {
          result.variantsCreated += 1;
        }
      }
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  return result;
}
