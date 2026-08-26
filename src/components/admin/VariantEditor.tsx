"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addVariant,
  removeVariant,
  updateVariant,
} from "@/app/(admin)/admin/products/[id]/actions";
import type { ProductVariant } from "@/types/database";

function VariantRow({
  productId,
  variant,
}: {
  productId: string;
  variant: ProductVariant;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          formData.set("variantId", variant.id);
          try {
            await updateVariant(productId, formData);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save.");
          }
        })
      }
      className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-3"
    >
      <div className="min-w-[140px] flex-1">
        <p className="text-sm font-medium text-neutral-900">
          {variant.variant_title ?? "Standard"}
        </p>
        <p className="text-xs text-neutral-400">{variant.sku ?? "no SKU"}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-700">Price ($)</label>
        <input
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={variant.b2c_price}
          className="mt-1 w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <label className="flex items-center gap-2 pb-1.5 text-sm text-neutral-700">
        <input type="checkbox" name="isAvailable" defaultChecked={variant.is_available} />
        Available
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await removeVariant(productId, variant.id);
            router.refresh();
          })
        }
        className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-50"
      >
        Remove
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

export function VariantEditor({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariant[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <div className="space-y-3">
      {variants.map((v) => (
        <VariantRow key={v.id} productId={productId} variant={v} />
      ))}
      {variants.length === 0 && (
        <p className="text-sm text-neutral-400">No variants yet.</p>
      )}

      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            setError(null);
            try {
              await addVariant(productId, formData);
              formRef.current?.reset();
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to add variant.");
            }
          })
        }
        className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-neutral-300 p-3"
      >
        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Variant name
          </label>
          <input
            name="variantTitle"
            placeholder="e.g. 220g Box"
            className="mt-1 w-36 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700">SKU</label>
          <input
            name="sku"
            className="mt-1 w-28 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700">Price ($)</label>
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            className="mt-1 w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700">Weight (g)</label>
          <input
            name="weightGrams"
            type="number"
            min={0}
            className="mt-1 w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Add variant
        </button>
      </form>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
