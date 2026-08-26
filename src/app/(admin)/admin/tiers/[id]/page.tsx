import { notFound } from "next/navigation";
import { getTier } from "@/lib/tiers";
import { EditTierForm } from "@/components/admin/EditTierForm";
import { VolumeDiscountEditor } from "@/components/admin/VolumeDiscountEditor";

interface TierDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TierDetailPage({ params }: TierDetailPageProps) {
  const { id } = await params;
  const tier = await getTier(id);
  if (!tier) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">{tier.name}</h1>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-neutral-700">Tier details</h2>
          <div className="mt-3">
            <EditTierForm
              tierId={tier.id}
              name={tier.name}
              discountPercent={Math.round(tier.base_discount_percent * 100)}
              isActive={tier.is_active}
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-neutral-700">
            Volume discount rules
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Applied on top of the base discount once quantity meets the
            threshold. The richest matching rule wins.
          </p>
          <div className="mt-3">
            <VolumeDiscountEditor tierId={tier.id} volumeDiscounts={tier.volume_discounts} />
          </div>
        </div>
      </div>
    </div>
  );
}
