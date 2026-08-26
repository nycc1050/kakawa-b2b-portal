"use client";

import { useActionState } from "react";
import { createTier, type CreateTierState } from "./actions";

const initialState: CreateTierState = { error: null };

export default function NewTierPage() {
  const [state, formAction, pending] = useActionState(createTier, initialState);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">New Tier</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Add volume discount rules after creating the tier.
      </p>

      <form action={formAction} className="mt-6 max-w-md space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
            Tier name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Wholesale-Monthly-Tier1"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="discountPercent" className="block text-sm font-medium text-neutral-700">
            Base discount off B2C price (%)
          </label>
          <input
            id="discountPercent"
            name="discountPercent"
            type="number"
            min={0}
            max={99}
            step={1}
            required
            className="mt-1 w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create tier"}
        </button>
      </form>
    </div>
  );
}
