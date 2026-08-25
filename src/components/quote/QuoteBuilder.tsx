"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { useQuote } from "@/lib/quote-context";
import { calcPrice, type Tier as PricingTier } from "@/lib/pricing";
import { QuoteDocument, type QuotePdfLineItem } from "@/lib/pdf/QuoteDocument";

interface QuoteBuilderProps {
  tier: PricingTier | null;
  tierName: string | null;
  companyName: string | null;
}

const QUOTE_VALIDITY_DAYS = 14;

export function QuoteBuilder({ tier, tierName, companyName }: QuoteBuilderProps) {
  const { items, removeItem, updateQuantity, clear } = useQuote();
  const [generating, setGenerating] = useState(false);

  const lines = useMemo(
    () =>
      items.map((item) => ({
        item,
        breakdown: calcPrice(item.b2cPrice, tier, item.quantity),
      })),
    [items, tier]
  );

  const grandTotal = lines.reduce((sum, l) => sum + l.breakdown.totalPrice, 0);
  const totalSavings = lines.reduce((sum, l) => sum + l.breakdown.savingsVsB2c, 0);

  async function handleDownloadPdf() {
    setGenerating(true);
    try {
      const now = new Date();
      const validUntil = new Date(now);
      validUntil.setDate(validUntil.getDate() + QUOTE_VALIDITY_DAYS);
      const dateFmt = (d: Date) =>
        d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

      const pdfItems: QuotePdfLineItem[] = lines.map(({ item, breakdown }) => ({
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
        unitPrice: breakdown.unitPrice,
        totalPrice: breakdown.totalPrice,
      }));

      const blob = await pdf(
        <QuoteDocument
          companyName={companyName ?? "Kakawa Customer"}
          tierName={tierName ?? "—"}
          quoteDate={dateFmt(now)}
          validUntil={dateFmt(validUntil)}
          items={pdfItems}
          grandTotal={grandTotal}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kakawa-quote-${now.toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
        <p className="text-sm text-neutral-500">Your quote is empty.</p>
        <Link
          href="/catalog"
          className="mt-3 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
        >
          Browse the catalog to add products →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Unit price</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {lines.map(({ item, breakdown }) => (
              <tr key={item.variantId} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-900">{item.productTitle}</div>
                  {item.variantTitle && (
                    <div className="text-xs text-neutral-500">{item.variantTitle}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.variantId, Number(e.target.value))
                    }
                    className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-neutral-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3 text-right text-neutral-600">
                  ${breakdown.unitPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-neutral-900">
                  ${breakdown.totalPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    className="text-xs text-neutral-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col items-end gap-1">
        {tier && totalSavings > 0 && (
          <p className="text-sm text-emerald-600">
            You save ${totalSavings.toFixed(2)} vs. B2C pricing
          </p>
        )}
        <p className="text-lg font-semibold text-neutral-900">
          Grand total: ${grandTotal.toFixed(2)}
        </p>
      </div>

      {!tier && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You don&apos;t have a pricing tier assigned yet — the totals above use
          B2C reference pricing. Contact Kakawa to get set up.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={generating}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {generating ? "Generating PDF..." : "Download quote PDF"}
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-md px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900"
        >
          Clear quote
        </button>
      </div>
    </div>
  );
}
