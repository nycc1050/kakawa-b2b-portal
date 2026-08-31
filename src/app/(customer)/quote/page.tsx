import { getCurrentUser, toPricingTier } from "@/lib/auth";
import { QuoteBuilder } from "@/components/quote/QuoteBuilder";

export default async function QuotePage() {
  const session = await getCurrentUser();
  const pricingTier = toPricingTier(
    session?.tier ?? null,
    session?.volumeDiscounts ?? []
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Quote</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Products you&apos;ve added from the catalog. Adjust quantities, then
        download a PDF to share.
      </p>
      <div className="mt-6">
        <QuoteBuilder
          tier={pricingTier}
          companyName={session?.customer?.company_name ?? null}
        />
      </div>
    </div>
  );
}
