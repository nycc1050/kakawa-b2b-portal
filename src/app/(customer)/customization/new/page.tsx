import { listProductOptions } from "@/lib/products";
import { RequestForm } from "@/components/customization/RequestForm";

interface NewCustomizationRequestPageProps {
  searchParams: Promise<{ productId?: string }>;
}

export default async function NewCustomizationRequestPage({
  searchParams,
}: NewCustomizationRequestPageProps) {
  const { productId } = await searchParams;
  const products = await listProductOptions();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Request Customization
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Colors, logo, embossing, or anything else you need — describe it here
        and Kakawa will review and follow up in your requests list.
      </p>
      <div className="mt-6">
        <RequestForm products={products} preselectedProductId={productId} />
      </div>
    </div>
  );
}
