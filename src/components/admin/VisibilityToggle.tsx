"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleProductVisibility } from "@/app/(admin)/admin/products/actions";

export function VisibilityToggle({
  productId,
  visible,
}: {
  productId: string;
  visible: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          await toggleProductVisibility(productId, !visible);
          router.refresh();
        });
      }}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${
        visible
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
      }`}
    >
      {pending ? "..." : visible ? "Visible" : "Hidden"}
    </button>
  );
}
