"use client";

import { useEffect } from "react";
import { recordCustomizationLink, useCustomizationLink } from "@/lib/customization-links";

interface CustomizationQuoteLinkProps {
  requestId: string;
}

export function CustomizationQuoteLink({ requestId }: CustomizationQuoteLinkProps) {
  // Reactive read - once the effect below writes a link, this picks it up
  // on its own (useSyncExternalStore), no manual setState needed here.
  const link = useCustomizationLink(requestId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("productId");
    if (params.get("linkedToQuote") !== "1" || !productId) return;

    recordCustomizationLink(requestId, productId);

    // Drop the one-time params, keep any others (e.g. submitted=1).
    params.delete("linkedToQuote");
    params.delete("productId");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }, [requestId]);

  if (!link) return null;

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
      <p className="text-xs uppercase tracking-wide text-neutral-400">Linked to your quote</p>
      <p className="mt-1 text-neutral-800">
        Reference <span className="font-mono font-medium">{link.reference}</span> — this will
        show next to the matching product on your{" "}
        <a href="/quote" className="underline underline-offset-4 hover:text-neutral-600">
          Quote page
        </a>
        .
      </p>
    </div>
  );
}
