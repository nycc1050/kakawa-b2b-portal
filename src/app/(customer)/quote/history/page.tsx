"use client";

import { useState } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { useQuoteHistory, type SavedQuote } from "@/lib/quote-history";
import { QuoteDocument } from "@/lib/pdf/QuoteDocument";

function formatSavedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function summarizeItems(quote: SavedQuote) {
  const totalUnits = quote.items.reduce((sum, i) => sum + i.quantity, 0);
  const productCount = quote.items.length;
  return `${productCount} product${productCount === 1 ? "" : "s"} · ${totalUnits} unit${totalUnits === 1 ? "" : "s"}`;
}

export default function QuoteHistoryPage() {
  const { quotes, removeQuote } = useQuoteHistory();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleRedownload(quote: SavedQuote) {
    setDownloadingId(quote.id);
    try {
      const blob = await pdf(
        <QuoteDocument
          companyName={quote.companyName}
          quoteDate={quote.quoteDate}
          validUntil={quote.validUntil}
          items={quote.items}
          grandTotal={quote.grandTotal}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kakawa-quote-${quote.createdAt.slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <Link href="/quote" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to quote
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Quote History</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Every quote you&apos;ve downloaded, most recent first. Kept in this browser only.
      </p>

      {quotes.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
          <p className="text-sm text-neutral-500">No past quotes yet.</p>
          <Link
            href="/catalog"
            className="mt-3 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
          >
            Browse the catalog to build one →
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {formatSavedDate(quote.createdAt)}
                </p>
                <p className="mt-0.5 text-sm text-neutral-500">{summarizeItems(quote)}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-base font-semibold text-neutral-900">
                  ${quote.grandTotal.toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => handleRedownload(quote)}
                  disabled={downloadingId === quote.id}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {downloadingId === quote.id ? "Preparing..." : "Download again"}
                </button>
                <button
                  type="button"
                  onClick={() => removeQuote(quote.id)}
                  className="text-xs text-neutral-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
