import Link from "next/link";
import { listVisibleProducts, listCategories } from "@/lib/products";
import { ProductCard } from "@/components/catalog/ProductCard";

interface CatalogPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { q, category } = await searchParams;
  const [products, categories] = await Promise.all([
    listVisibleProducts({ search: q, category }),
    listCategories(),
  ]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Catalog</h1>

        <form className="flex flex-wrap gap-2" action="/catalog" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search products..."
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Filter
          </button>
          {(q || category) && (
            <Link
              href="/catalog"
              className="rounded-md px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-900"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          No products match your filters.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
