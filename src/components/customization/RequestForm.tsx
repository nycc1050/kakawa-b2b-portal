"use client";

import { useActionState } from "react";
import {
  submitCustomizationRequest,
  type SubmitRequestState,
} from "@/app/(customer)/customization/new/actions";

interface RequestFormProps {
  products: { id: string; title: string }[];
  preselectedProductId?: string;
}

const initialState: SubmitRequestState = { error: null };

export function RequestForm({ products, preselectedProductId }: RequestFormProps) {
  const [state, formAction, pending] = useActionState(
    submitCustomizationRequest,
    initialState
  );

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div>
        <label htmlFor="productId" className="block text-sm font-medium text-neutral-700">
          Product
        </label>
        <select
          id="productId"
          name="productId"
          required
          defaultValue={preselectedProductId ?? ""}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          <option value="" disabled>
            Select a product...
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="estimatedQuantity" className="block text-sm font-medium text-neutral-700">
          Estimated quantity <span className="text-neutral-400">(optional)</span>
        </label>
        <input
          id="estimatedQuantity"
          name="estimatedQuantity"
          type="number"
          min={1}
          className="mt-1 w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="colorPreferences" className="block text-sm font-medium text-neutral-700">
          Color preferences
        </label>
        <textarea
          id="colorPreferences"
          name="colorPreferences"
          rows={2}
          placeholder="e.g. gold and burgundy foil wrap to match our brand"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-neutral-700">
          Logo file <span className="text-neutral-400">(optional, 5MB max)</span>
        </label>
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/*,.pdf,.ai,.eps"
          className="mt-1 w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
        />
      </div>

      <div>
        <label htmlFor="embossingDetails" className="block text-sm font-medium text-neutral-700">
          Embossing / printing / stamping details
        </label>
        <textarea
          id="embossingDetails"
          name="embossingDetails"
          rows={3}
          placeholder="e.g. emboss company logo on top of each piece, no printing on wrapper"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="specialInstructions" className="block text-sm font-medium text-neutral-700">
          Special instructions
        </label>
        <textarea
          id="specialInstructions"
          name="specialInstructions"
          rows={3}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <label className="flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
        <input type="checkbox" name="includeInQuote" value="yes" className="mt-0.5" />
        <span>
          Include in quote?
          <span className="mt-0.5 block text-xs text-neutral-500">
            Generates a reference number and flags this request on your Quote
            page, so Kakawa can see the two go together. Optional - doesn&apos;t
            change how the request itself is handled.
          </span>
        </span>
      </label>

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
        {pending ? "Submitting..." : "Submit request"}
      </button>
    </form>
  );
}
