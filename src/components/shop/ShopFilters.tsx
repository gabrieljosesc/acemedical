import Link from "next/link";
import type { ShopFilterOption } from "@/lib/shop-products";

export type ShopParams = {
  search?: string;
  category?: string;
  brand?: string;
  min_price?: string;
  max_price?: string;
  sort?: string;
};

function buildUrl(pathname: string, current: ShopParams, overrides: Partial<ShopParams>) {
  const merged: ShopParams = { ...current, ...overrides };
  const qs = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&");
  return qs ? `${pathname}?${qs}` : pathname;
}

export default function ShopFilters({
  pathname,
  current,
  categories,
  brands,
  hideCategoryFilter,
  hideBrandFilter,
}: {
  pathname: string;
  current: ShopParams;
  categories: ShopFilterOption[];
  brands: ShopFilterOption[];
  hideCategoryFilter?: boolean;
  hideBrandFilter?: boolean;
}) {
  const hasFilters = Boolean(
    current.search || current.category || current.brand || current.min_price || current.max_price
  );

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Filters</h2>
        {hasFilters && (
          <Link href={pathname} className="font-mono text-[11px] text-ink-faint hover:text-teal transition-colors">
            Clear all
          </Link>
        )}
      </div>

      <form action={pathname} method="get" className="space-y-2 border-t border-line pt-5">
        {current.category && <input type="hidden" name="category" value={current.category} />}
        {current.brand && <input type="hidden" name="brand" value={current.brand} />}
        {current.sort && <input type="hidden" name="sort" value={current.sort} />}
        <h3 className="text-[13px] font-medium text-ink mb-2.5">Price range (USD)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            name="min_price"
            placeholder="Min"
            defaultValue={current.min_price}
            className="w-full border border-line rounded-sm px-2.5 py-1.5 text-[13px] bg-card outline-none focus:border-teal transition-colors"
          />
          <input
            type="number"
            name="max_price"
            placeholder="Max"
            defaultValue={current.max_price}
            className="w-full border border-line rounded-sm px-2.5 py-1.5 text-[13px] bg-card outline-none focus:border-teal transition-colors"
          />
        </div>
        <button
          type="submit"
          className="w-full border border-line-strong rounded-sm py-1.5 text-[12.5px] font-medium text-ink hover:border-teal hover:text-teal transition-colors mt-1"
        >
          Apply
        </button>
      </form>

      {!hideCategoryFilter && (
        <div className="border-t border-line pt-5">
          <h3 className="text-[13px] font-medium text-ink mb-2.5">Category</h3>
          <ul className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const active = current.category === cat.slug;
              return (
                <li key={cat.slug}>
                  <Link
                    href={buildUrl(pathname, current, { category: active ? undefined : cat.slug })}
                    className={`block text-[13.5px] px-2 py-1.5 rounded-sm transition-colors ${
                      active ? "bg-teal-tint text-teal font-medium" : "text-ink-soft hover:bg-surface"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!hideBrandFilter && brands.length > 0 && (
        <div className="border-t border-line pt-5">
          <h3 className="text-[13px] font-medium text-ink mb-2.5">Brand</h3>
          <ul className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
            {brands.map((b) => {
              const active = current.brand === b.slug;
              return (
                <li key={b.slug}>
                  <Link
                    href={buildUrl(pathname, current, { brand: active ? undefined : b.slug })}
                    className={`block text-[13.5px] px-2 py-1.5 rounded-sm transition-colors ${
                      active ? "bg-teal-tint text-teal font-medium" : "text-ink-soft hover:bg-surface"
                    }`}
                  >
                    {b.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}
