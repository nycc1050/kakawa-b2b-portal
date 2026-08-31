import Link from "next/link";
import { listAllProductsForAdmin } from "@/lib/products";
import { VisibilityToggle } from "@/components/admin/VisibilityToggle";
import { SyncShopifyButton } from "@/components/admin/SyncShopifyButton";

// The Shopify sync action (invoked from SyncShopifyButton below) fetches
// the full catalog then upserts ~430 rows sequentially - measured at ~76s
// end-to-end against the live store, well past Vercel's 10s default
// function timeout. Server Action duration is controlled by the calling
// route's segment config, not the "use server" file itself. Set as high as
// Vercel allows; on a plan whose cap is lower, Vercel clamps this down
// rather than erroring, so there's no harm in asking for more than Hobby's
// 60s ceiling.
export const maxDuration = 300;

function priceRange(variants: { b2c_price: number }[]) {
  if (variants.length === 0) return "—";
  const prices = variants.map((v) => v.b2c_price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} – $${max.toFixed(2)}`;
}

export default async function AdminProductsPage() {
  const products = await listAllProductsForAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Products</h1>
        <div className="flex flex-wrap items-start gap-3">
          <SyncShopifyButton />
          <Link
            href="/admin/products/csv"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            CSV upload
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add product
          </Link>
        </div>
      </div>

      <p className="mt-2 text-sm text-neutral-500">
        {products.length} products · scraped from Kakawa&apos;s Shopify catalog plus
        any manual additions.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">B2C price</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">{p.category ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {priceRange(p.product_variants)}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs uppercase tracking-wide text-neutral-400">
                    {p.source}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <VisibilityToggle productId={p.id} visible={p.is_b2b_visible} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  No products yet. Run <code>npm run scrape</code> or add one manually.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
