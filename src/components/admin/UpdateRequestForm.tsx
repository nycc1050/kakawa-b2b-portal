"use client";

import { useActionState } from "react";
import {
  updateRequestStatus,
  type UpdateRequestState,
} from "@/app/(admin)/admin/requests/[id]/actions";
import type { RequestStatus } from "@/types/database";

interface UpdateRequestFormProps {
  requestId: string;
  status: RequestStatus;
  adminNotes: string | null;
}

const STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "in-review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "ready-to-order", label: "Ready to order" },
];

const initialState: UpdateRequestState = { error: null, success: false };

export function UpdateRequestForm({
  requestId,
  status,
  adminNotes,
}: UpdateRequestFormProps) {
  const [state, formAction, pending] = useActionState(
    updateRequestStatus.bind(null, requestId),
    initialState
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-neutral-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="adminNotes" className="block text-sm font-medium text-neutral-700">
          Notes to customer
        </label>
        <textarea
          id="adminNotes"
          name="adminNotes"
          rows={4}
          defaultValue={adminNotes ?? ""}
          placeholder="Visible to the customer on their request page"
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
