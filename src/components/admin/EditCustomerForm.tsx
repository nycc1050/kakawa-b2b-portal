"use client";

import { useActionState } from "react";
import {
  updateCustomer,
  type UpdateCustomerState,
} from "@/app/(admin)/admin/customers/[id]/actions";
import type { Tier } from "@/types/database";

interface EditCustomerFormProps {
  customerId: string;
  companyName: string;
  phone: string | null;
  tierId: string | null;
  tiers: Tier[];
}

const initialState: UpdateCustomerState = { error: null, success: false };

export function EditCustomerForm({
  customerId,
  companyName,
  phone,
  tierId,
  tiers,
}: EditCustomerFormProps) {
  const [state, formAction, pending] = useActionState(
    updateCustomer.bind(null, customerId),
    initialState
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-neutral-700">
          Company name
        </label>
        <input
          id="companyName"
          name="companyName"
          defaultValue={companyName}
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          defaultValue={phone ?? ""}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="tierId" className="block text-sm font-medium text-neutral-700">
          Pricing tier
        </label>
        <select
          id="tierId"
          name="tierId"
          defaultValue={tierId ?? ""}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="">Not assigned</option>
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({Math.round(t.base_discount_percent * 100)}% off)
            </option>
          ))}
        </select>
      </div>

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
