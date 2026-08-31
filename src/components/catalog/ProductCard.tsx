import Link from "next/link";
import type { ProductWithVariants } from "@/lib/products";

function formatPriceRange(variants: ProductWithVariants["product_variants"]) {
  if (variants.length === 0) return "No pricing available";
  const prices = variants.map((v) => v.b2c_price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const allUnavailable =
    product.product_variants.length > 0 &&
    product.product_variants.every((v) => !v.is_available);

  return (
    <Link
      href={`/catalog/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:border-neutral-400 hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        {product.image_url ? (
          // Shopify CDN images are hotlinked directly per the build plan.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            No image
          </div>
        )}
        {allUnavailable && (
          <span className="absolute right-2 top-2 rounded-full bg-neutral-900/85 px-2.5 py-1 text-xs font-medium text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="text-sm font-medium leading-snug text-neutral-900">{product.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-medium text-neutral-700">
            {formatPriceRange(product.product_variants)}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-400 transition group-hover:text-neutral-900">
            Shop →
          </span>
        </div>
      </div>
    </Link>
  );
}
