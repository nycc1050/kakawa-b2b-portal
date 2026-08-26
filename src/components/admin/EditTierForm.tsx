"use client";

import { useActionState } from "react";
import { updateTier, type UpdateTierState } from "@/app/(admin)/admin/tiers/[id]/actions";

interface EditTierFormProps {
  tierId: string;
  name: string;
  discountPercent: number; // 0-99
  isActive: boolean;
}

const initialState: UpdateTierState = { error: null, success: false };

export function EditTierForm({ tierId, name, discountPercent, isActive }: EditTierFormProps) {
  const [state, formAction, pending] = useActionState(
    updateTier.bind(null, tierId),
    initialState
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
          Tier name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={name}
          required
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
          defaultValue={discountPercent}
          required
          className="mt-1 w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" name="isActive" defaultChecked={isActive} />
        Active (assignable to customers)
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-emerald-600">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
