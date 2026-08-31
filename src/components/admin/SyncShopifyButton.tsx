"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncShopifyCatalog } from "@/app/(admin)/admin/products/actions";

type Result =
  | { kind: "success"; productsUpserted: number; variantsUpserted: number; errorCount: number }
  | { kind: "error"; message: string };

export function SyncShopifyButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const router = useRouter();

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await syncShopifyCatalog();
        setResult({
          kind: "success",
          productsUpserted: res.productsUpserted,
          variantsUpserted: res.variantsUpserted,
          errorCount: res.errors.length,
        });
        router.refresh();
      } catch (err) {
        setResult({
          kind: "error",
          message: err instanceof Error ? err.message : "Sync failed.",
        });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
      >
        {pending && (
          <svg className="h-4 w-4 animate-spin text-neutral-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {pending ? "Syncing from Shopify..." : "Sync from Shopify"}
      </button>

      {result?.kind === "success" && (
        <p className="max-w-xs text-right text-xs text-emerald-700">
          Synced {result.productsUpserted} products ({result.variantsUpserted} variants) from
          Shopify.
          {result.errorCount > 0 && (
            <span className="text-amber-700"> {result.errorCount} row(s) had errors.</span>
          )}
        </p>
      )}
      {result?.kind === "error" && (
        <p className="max-w-xs text-right text-xs text-red-600" role="alert">
          {result.message}
        </p>
      )}
    </div>
  );
}
