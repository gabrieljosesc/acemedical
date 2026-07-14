import ProductCard from "@/components/products/ProductCard";
import ShopFilters, { type ShopParams } from "@/components/shop/ShopFilters";
import SortLinks from "@/components/shop/SortLinks";
import Pagination from "@/components/shop/Pagination";
import type { CatalogProduct } from "@/lib/types";
import type { ShopFilterOption } from "@/lib/shop-products";

export default function ShopResults({
  pathname,
  current,
  page,
  pageSize,
  products,
  count,
  categories,
  brands,
  hideCategoryFilter,
}: {
  pathname: string;
  current: ShopParams;
  page: number;
  pageSize: number;
  products: CatalogProduct[];
  count: number;
  categories: ShopFilterOption[];
  brands: ShopFilterOption[];
  hideCategoryFilter?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <ShopFilters
        pathname={pathname}
        current={current}
        categories={categories}
        brands={brands}
        hideCategoryFilter={hideCategoryFilter}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
          <p className="font-mono text-[12px] text-ink-soft tabular">
            {count === 0 ? "No results" : `Showing ${from}–${to} of ${count}`}
          </p>
          <SortLinks pathname={pathname} current={current} />
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-line rounded-[4px]">
            <p className="text-[15px] font-medium text-ink">No products found</p>
            <p className="text-[13px] text-ink-soft mt-1">Try adjusting your filters or search term.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10">
            <Pagination pathname={pathname} current={current} page={page} totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  );
}
