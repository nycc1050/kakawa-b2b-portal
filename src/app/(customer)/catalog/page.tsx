import { Suspense } from "react";
import {
  listVisibleProducts,
  listCatalogTags,
  getCatalogPriceBounds,
  type ProductWithVariants,
} from "@/lib/products";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CatalogFilters, type SortOption } from "@/components/catalog/CatalogFilters";

interface CatalogPageProps {
  searchParams: Promise<{
    q?: string;
    tag?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

function cheapestPrice(product: ProductWithVariants): number | null {
  if (product.product_variants.length === 0) return null;
  return product.product_variants[0].b2c_price; // pre-sorted cheapest-first
}

function sortProducts(products: ProductWithVariants[], sort: SortOption) {
  const sorted = [...products];
  switch (sort) {
    case "name-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "price-asc":
      return sorted.sort((a, b) => (cheapestPrice(a) ?? Infinity) - (cheapestPrice(b) ?? Infinity));
    case "price-desc":
      return sorted.sort((a, b) => (cheapestPrice(b) ?? -Infinity) - (cheapestPrice(a) ?? -Infinity));
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "name-asc":
    default:
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
}

const VALID_SORTS: SortOption[] = ["name-asc", "name-desc", "price-asc", "price-desc", "newest"];

async function CatalogResults({ searchParams }: CatalogPageProps) {
  const { q, tag, sort, minPrice, maxPrice } = await searchParams;
  const activeSort = VALID_SORTS.includes(sort as SortOption) ? (sort as SortOption) : "name-asc";

  const [products, tags, priceBounds] = await Promise.all([
    listVisibleProducts({ search: q, tag }),
    listCatalogTags(),
    getCatalogPriceBounds(),
  ]);

  const min = minPrice ? Number(minPrice) : null;
  const max = maxPrice ? Number(maxPrice) : null;
  const priceFiltered = products.filter((p) => {
    const price = cheapestPrice(p);
    if (price === null) return min === null && max === null;
    if (min !== null && price < min) return false;
    if (max !== null && price > max) return false;
    return true;
  });

  const results = sortProducts(priceFiltered, activeSort);

  return (
    <CatalogFilters
      tags={tags}
      priceBounds={priceBounds}
      initialQuery={q ?? ""}
      initialTag={tag ?? ""}
      initialSort={activeSort}
      initialMinPrice={minPrice ?? ""}
      initialMaxPrice={maxPrice ?? ""}
      resultCount={results.length}
    >
      {results.length === 0 ? (
        <p className="text-sm text-neutral-500">No products match your filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </CatalogFilters>
  );
}

export default function CatalogPage({ searchParams }: CatalogPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Catalog</h1>
      <div className="mt-6">
        <Suspense fallback={null}>
          <CatalogResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
