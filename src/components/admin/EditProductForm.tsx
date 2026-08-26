"use client";

import { useActionState } from "react";
import {
  updateProduct,
  type UpdateProductState,
} from "@/app/(admin)/admin/products/[id]/actions";

interface EditProductFormProps {
  productId: string;
  title: string;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
}

const initialState: UpdateProductState = { error: null, success: false };

export function EditProductForm({
  productId,
  title,
  category,
  description,
  imageUrl,
}: EditProductFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProduct.bind(null, productId),
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={title}
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-neutral-700">
          Category
        </label>
        <input
          id="category"
          name="category"
          defaultValue={category ?? ""}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={description ?? ""}
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
          defaultValue={imageUrl ?? ""}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
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
