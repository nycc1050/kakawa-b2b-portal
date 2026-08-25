import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import { VariantPricing } from "@/components/catalog/VariantPricing";
import type { Tier as PricingTier } from "@/lib/pricing";

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const [product, session] = await Promise.all([
    getProduct(productId),
    getCurrentUser(),
  ]);

  if (!product) notFound();

  const pricingTier: PricingTier | null = session?.tier
    ? {
        baseDiscountPercent: session.tier.base_discount_percent,
        volumeDiscounts: session.volumeDiscounts.map((v) => ({
          minQuantity: v.min_quantity,
          additionalDiscountPercent: v.additional_discount_percent,
        })),
      }
    : null;

  return (
    <div>
      <Link href="/catalog" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to catalog
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              No image
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <span className="text-xs uppercase tracking-wide text-neutral-400">
              {product.category}
            </span>
          )}
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
            {product.title}
          </h1>
          {product.description && (
            <p className="mt-2 text-sm text-neutral-600">{product.description}</p>
          )}

          <div className="mt-6">
            <VariantPricing
              variants={product.product_variants}
              tier={pricingTier}
              tierName={session?.tier?.name ?? null}
            />
          </div>

          <Link
            href={`/customization/new?productId=${product.id}`}
            className="mt-6 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
          >
            Need custom colors, logo, or embossing? Submit a request →
          </Link>
        </div>
      </div>
    </div>
  );
}
