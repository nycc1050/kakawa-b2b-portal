"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCustomerActive } from "@/app/(admin)/admin/customers/[id]/actions";

export function ToggleActiveButton({
  customerId,
  isActive,
}: {
  customerId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleCustomerActive(customerId, !isActive);
          router.refresh();
        })
      }
      className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
        isActive
          ? "border border-red-200 text-red-600 hover:bg-red-50"
          : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      }`}
    >
      {pending ? "Working..." : isActive ? "Deactivate customer" : "Reactivate customer"}
    </button>
  );
}
