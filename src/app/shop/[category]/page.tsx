import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  getShopProducts,
  getShopFilterOptions,
  getCategoryBySlug,
  type ShopSort,
} from "@/lib/shop-products";
import ShopResults from "@/components/shop/ShopResults";

const PAGE_SIZE = 12;

type RawSearchParams = Record<string, string | string[] | undefined>;

function one(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return { title: category.name };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const raw = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const brand = one(raw.brand);
  const min_price = one(raw.min_price);
  const max_price = one(raw.max_price);
  const sort = one(raw.sort) as ShopSort | undefined;
  const page = Math.max(1, parseInt(one(raw.page) ?? "1", 10) || 1);

  const pathname = `/shop/${slug}`;

  const [{ products, count }, { categories, brands }] = await Promise.all([
    getShopProducts({ category: slug, brand, min_price, max_price, sort, page, pageSize: PAGE_SIZE }),
    getShopFilterOptions(slug),
  ]);

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-10">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-5">
        <Link href="/" className="hover:text-teal transition-colors">
          Home
        </Link>
        <ChevronRight size={13} />
        <Link href="/shop" className="hover:text-teal transition-colors">
          Shop
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink">{category.name}</span>
      </nav>

      <h1 className="font-serif font-medium text-[30px] sm:text-[38px] tracking-tight mb-1.5 text-balance">
        {category.name}
      </h1>
      {category.description && <p className="text-ink-soft text-[15px] mb-8">{category.description}</p>}
      {!category.description && <div className="mb-8" />}

      <ShopResults
        pathname={pathname}
        current={{ brand, min_price, max_price, sort }}
        page={page}
        pageSize={PAGE_SIZE}
        products={products}
        count={count}
        categories={categories}
        brands={brands}
        hideCategoryFilter
      />
    </div>
  );
}
