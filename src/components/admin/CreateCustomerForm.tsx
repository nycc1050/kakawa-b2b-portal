"use client";

import { useActionState } from "react";
import {
  createCustomer,
  type CreateCustomerState,
} from "@/app/(admin)/admin/customers/new/actions";
import type { Tier } from "@/types/database";

const initialState: CreateCustomerState = { error: null };

export function CreateCustomerForm({ tiers }: { tiers: Tier[] }) {
  const [state, formAction, pending] = useActionState(createCustomer, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-neutral-700">
          Company name
        </label>
        <input
          id="companyName"
          name="companyName"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700">
          Contact name
        </label>
        <input
          id="fullName"
          name="fullName"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
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
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="">Not assigned yet</option>
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

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create customer & send invite"}
      </button>
    </form>
  );
}
