import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getShopProducts, getShopFilterOptions, type ShopSort } from "@/lib/shop-products";
import ShopResults from "@/components/shop/ShopResults";

const PAGE_SIZE = 12;

type RawSearchParams = Record<string, string | string[] | undefined>;

function one(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export const metadata: Metadata = {
  title: "Shop all products",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const search = one(raw.search);
  const category = one(raw.category);
  const brand = one(raw.brand);
  const min_price = one(raw.min_price);
  const max_price = one(raw.max_price);
  const sort = one(raw.sort) as ShopSort | undefined;
  const page = Math.max(1, parseInt(one(raw.page) ?? "1", 10) || 1);

  const [{ products, count }, { categories, brands }] = await Promise.all([
    getShopProducts({ search, category, brand, min_price, max_price, sort, page, pageSize: PAGE_SIZE }),
    getShopFilterOptions(category),
  ]);

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-10">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-5">
        <Link href="/" className="hover:text-teal transition-colors">
          Home
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink">Shop</span>
      </nav>

      <h1 className="font-serif font-medium text-[30px] sm:text-[38px] tracking-tight mb-8 text-balance">
        {search ? `Search results for "${search}"` : "All products"}
      </h1>

      <ShopResults
        pathname="/shop"
        current={{ search, category, brand, min_price, max_price, sort }}
        page={page}
        pageSize={PAGE_SIZE}
        products={products}
        count={count}
        categories={categories}
        brands={brands}
        hideBrandFilter={!category}
      />
    </div>
  );
}
