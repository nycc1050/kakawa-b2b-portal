/**
 * One-off / re-runnable importer: pulls Kakawa's live Shopify catalog and
 * upserts it into products / product_variants. See src/lib/shopify-sync.ts
 * for the actual logic - this script and the admin console's "Sync from
 * Shopify" button both call the same function.
 *
 * Usage: npm run scrape
 */
import { config } from "dotenv";

// tsx runs outside Next, which normally loads .env.local for us.
config({ path: ".env.local" });

import { syncShopifyProducts } from "../src/lib/shopify-sync";

async function main() {
  console.log("Fetching Shopify catalog...");
  const result = await syncShopifyProducts();
  console.log(`Fetched ${result.fetchedProducts} products from Shopify.`);
  console.log(
    `Done. Upserted ${result.productsUpserted} products / ${result.variantsUpserted} variants.`
  );
  if (result.errors.length > 0) {
    console.error(`${result.errors.length} error(s):`);
    for (const e of result.errors) console.error(` - ${e}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
