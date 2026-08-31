"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface CatalogTag {
  tag: string;
  count: number;
}

export type SortOption =
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "newest";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "newest", label: "Newest" },
];

const DEBOUNCE_MS = 350;

interface CatalogFiltersProps {
  tags: CatalogTag[];
  priceBounds: { min: number; max: number };
  initialQuery: string;
  initialTag: string;
  initialSort: SortOption;
  initialMinPrice: string;
  initialMaxPrice: string;
  resultCount: number;
  children: React.ReactNode;
}

export function CatalogFilters({
  tags,
  priceBounds,
  initialQuery,
  initialTag,
  initialSort,
  initialMinPrice,
  initialMaxPrice,
  resultCount,
  children,
}: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Debounced auto-apply for free-text inputs (search, price range) - no
  // "Apply filter" button, but also no request-per-keystroke.
  useEffect(() => {
    if (!mountedRef.current) {
      // Skip the mount run - query/minPrice/maxPrice already match the URL
      // they were initialized from, nothing to apply yet.
      mountedRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ q: query || null, minPrice: minPrice || null, maxPrice: maxPrice || null });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, minPrice, maxPrice]);

  const hasActiveFilters =
    Boolean(initialQuery) ||
    Boolean(initialTag) ||
    Boolean(initialMinPrice) ||
    Boolean(initialMaxPrice) ||
    initialSort !== "name-asc";

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Sidebar - categories + price range, applies instantly (no submit button). */}
      <aside className="shrink-0 lg:w-56">
        <div className="lg:sticky lg:top-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none lg:hidden"
          />

          <h2 className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400 lg:mt-0">
            Category
          </h2>
          <nav className="mt-2 flex flex-wrap gap-2 lg:mt-3 lg:flex-col lg:gap-1">
            <button
              type="button"
              onClick={() => pushParams({ tag: null })}
              className={`rounded-md px-2.5 py-1.5 text-left text-sm lg:rounded-none lg:border-l-2 lg:px-3 ${
                !initialTag
                  ? "bg-neutral-900 text-white lg:border-neutral-900 lg:bg-transparent lg:font-medium lg:text-neutral-900"
                  : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50 lg:border-l-2 lg:border-transparent lg:border-y-0 lg:border-r-0 lg:text-neutral-600 lg:hover:border-neutral-300"
              }`}
            >
              All products
            </button>
            {tags.map((t) => {
              const active = initialTag === t.tag;
              return (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => pushParams({ tag: active ? null : t.tag })}
                  className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm lg:rounded-none lg:border-l-2 lg:px-3 ${
                    active
                      ? "bg-neutral-900 text-white lg:border-neutral-900 lg:bg-transparent lg:font-medium lg:text-neutral-900"
                      : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50 lg:border-l-2 lg:border-transparent lg:border-y-0 lg:border-r-0 lg:text-neutral-600 lg:hover:border-neutral-300"
                  }`}
                >
                  <span>{t.tag}</span>
                  <span className={active ? "text-neutral-300" : "text-neutral-400"}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </nav>

          {priceBounds.max > priceBounds.min && (
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Price
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <label className="sr-only" htmlFor="minPrice">
                  Minimum price
                </label>
                <input
                  id="minPrice"
                  type="number"
                  min={0}
                  placeholder={`$${priceBounds.min}`}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full min-w-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
                />
                <span className="text-neutral-400">–</span>
                <label className="sr-only" htmlFor="maxPrice">
                  Maximum price
                </label>
                <input
                  id="maxPrice"
                  type="number"
                  min={0}
                  placeholder={`$${priceBounds.max}`}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full min-w-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setMinPrice("");
                setMaxPrice("");
                router.replace(pathname, { scroll: false });
              }}
              className="mt-4 text-xs font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
            >
              Reset filters
            </button>
          )}
        </div>
      </aside>

      {/* Main column - search (desktop) + sort, both apply instantly. */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="hidden w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none lg:block"
          />
          <div className="flex items-center justify-between gap-3 sm:ml-auto">
            <span className="text-sm text-neutral-400">
              {resultCount} product{resultCount === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-neutral-500">
                Sort by
              </label>
              <select
                id="sort"
                value={initialSort}
                onChange={(e) => pushParams({ sort: e.target.value })}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
