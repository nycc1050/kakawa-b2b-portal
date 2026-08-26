import { notFound } from "next/navigation";
import { getProductForAdmin } from "@/lib/products";
import { EditProductForm } from "@/components/admin/EditProductForm";
import { VariantEditor } from "@/components/admin/VariantEditor";
import { VisibilityToggle } from "@/components/admin/VisibilityToggle";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductForAdmin(id);
  if (!product) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">{product.title}</h1>
        <VisibilityToggle productId={product.id} visible={product.is_b2b_visible} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-neutral-700">Details</h2>
          <div className="mt-3">
            <EditProductForm
              productId={product.id}
              title={product.title}
              category={product.category}
              description={product.description}
              imageUrl={product.image_url}
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-neutral-700">Variants</h2>
          <div className="mt-3">
            <VariantEditor productId={product.id} variants={product.product_variants} />
          </div>
        </div>
      </div>
    </div>
  );
}
