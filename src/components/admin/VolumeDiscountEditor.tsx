"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addVolumeDiscount,
  removeVolumeDiscount,
} from "@/app/(admin)/admin/tiers/[id]/actions";
import type { VolumeDiscount } from "@/types/database";

export function VolumeDiscountEditor({
  tierId,
  volumeDiscounts,
}: {
  tierId: string;
  volumeDiscounts: VolumeDiscount[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <div>
      <ul className="space-y-2">
        {volumeDiscounts.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm"
          >
            <span>
              Qty ≥ {v.min_quantity}:{" "}
              <span className="font-medium">
                extra {Math.round(v.additional_discount_percent * 100)}% off
              </span>
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await removeVolumeDiscount(tierId, v.id);
                  router.refresh();
                })
              }
              className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-50"
            >
              Remove
            </button>
          </li>
        ))}
        {volumeDiscounts.length === 0 && (
          <li className="text-sm text-neutral-400">No volume discount rules yet.</li>
        )}
      </ul>

      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            setError(null);
            try {
              await addVolumeDiscount(tierId, formData);
              formRef.current?.reset();
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to add rule.");
            }
          })
        }
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <div>
          <label htmlFor="minQuantity" className="block text-xs font-medium text-neutral-700">
            Min quantity
          </label>
          <input
            id="minQuantity"
            name="minQuantity"
            type="number"
            min={1}
            required
            className="mt-1 w-28 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="additionalPercent" className="block text-xs font-medium text-neutral-700">
            Extra discount (%)
          </label>
          <input
            id="additionalPercent"
            name="additionalPercent"
            type="number"
            min={1}
            max={99}
            required
            className="mt-1 w-28 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Add rule
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
