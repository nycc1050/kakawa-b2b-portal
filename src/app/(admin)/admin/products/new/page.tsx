"use client";

import { useActionState } from "react";
import { createProduct, type CreateProductState } from "./actions";

const initialState: CreateProductState = { error: null };

export default function NewProductPage() {
  const [state, formAction, pending] = useActionState(createProduct, initialState);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Add Product</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Creates the product with one variant. Add more variants after saving.
      </p>

      <form action={formAction} className="mt-6 max-w-lg space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-neutral-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-neutral-700">
              Category
            </label>
            <input
              id="category"
              name="category"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-neutral-700">
              SKU
            </label>
            <input
              id="sku"
              name="sku"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-neutral-700">
            Image URL
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-neutral-700">
              B2C price ($)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step="0.01"
              required
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="weightGrams" className="block text-sm font-medium text-neutral-700">
              Weight (g)
            </label>
            <input
              id="weightGrams"
              name="weightGrams"
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
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
          {pending ? "Creating..." : "Create product"}
        </button>
      </form>
    </div>
  );
}
