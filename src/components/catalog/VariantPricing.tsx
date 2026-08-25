"use client";

import { useMemo, useState } from "react";
import { calcPrice, type Tier as PricingTier } from "@/lib/pricing";
import { useQuote } from "@/lib/quote-context";
import type { ProductVariant } from "@/types/database";

interface VariantPricingProps {
  productId: string;
  productTitle: string;
  productImageUrl: string | null;
  variants: ProductVariant[];
  tier: PricingTier | null;
  tierName: string | null;
}

export function VariantPricing({
  productId,
  productTitle,
  productImageUrl,
  variants,
  tier,
  tierName,
}: VariantPricingProps) {
  const { addItem } = useQuote();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const breakdown = useMemo(
    () => (variant ? calcPrice(variant.b2c_price, tier, quantity) : null),
    [variant, tier, quantity]
  );

  if (!variant) {
    return <p className="text-sm text-neutral-500">No variants available.</p>;
  }

  return (
    <div className="space-y-4">
      {variants.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Option
          </label>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={!v.is_available}>
                {(v.variant_title ?? "Standard") +
                  ` — $${v.b2c_price.toFixed(2)} B2C` +
                  (v.is_available ? "" : " (unavailable)")}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Quantity
        </label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          className="mt-1 w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {!variant.is_available && (
        <p className="text-sm font-medium text-red-500">
          This option is currently unavailable.
        </p>
      )}

      <button
        type="button"
        disabled={!variant.is_available}
        onClick={() => {
          addItem({
            productId,
            productTitle,
            productImageUrl,
            variantId: variant.id,
            variantTitle: variant.variant_title,
            b2cPrice: variant.b2c_price,
            quantity,
          });
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        }}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {added ? "Added to quote ✓" : "Add to quote"}
      </button>

      {tier ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            {tierName} pricing
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-neutral-900">
              ${breakdown?.unitPrice.toFixed(2)}
            </span>
            <span className="text-sm text-neutral-500">/ unit</span>
          </div>
          <dl className="mt-3 space-y-1 text-sm text-neutral-600">
            <div className="flex justify-between">
              <dt>B2C price</dt>
              <dd>${variant.b2c_price.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Tier discount</dt>
              <dd>-{Math.round((breakdown?.tierDiscountPercent ?? 0) * 100)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt>Volume discount</dt>
              <dd>
                {breakdown && breakdown.volumeDiscountPercent > 0
                  ? `-${Math.round(breakdown.volumeDiscountPercent * 100)}%`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-1 font-medium text-neutral-900">
              <dt>Total ({quantity} units)</dt>
              <dd>${breakdown?.totalPrice.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between text-emerald-600">
              <dt>You save</dt>
              <dd>${breakdown?.savingsVsB2c.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You don&apos;t have a pricing tier assigned yet — contact Kakawa to get
          set up. Showing B2C reference pricing only.
        </p>
      )}
    </div>
  );
}
