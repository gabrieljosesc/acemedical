import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import type { CatalogProduct } from "@/lib/types";

export default function BestSellers({ products }: { products: CatalogProduct[] }) {
  return (
    <section className="pb-12 sm:pb-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <div className="flex justify-between items-end gap-6 flex-wrap mb-8">
          <div>
            <p className="eyebrow">Best sellers</p>
            <h2 className="font-serif font-medium text-[26px] sm:text-[38px] tracking-tight mt-2.5 text-balance">
              What clinics reorder most.
            </h2>
            <p className="text-ink-soft text-[15px] max-w-[52ch] mt-2">
              Trade-net pricing shown. Log in to your account for volume
              tiers and contract rates.
            </p>
          </div>
          <Link
            href="/shop?sort=best-selling"
            className="font-mono text-[12px] tracking-wide text-teal inline-flex gap-1.5 items-center whitespace-nowrap border-b border-transparent hover:border-teal pb-0.5 transition-colors"
          >
            View best sellers
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
