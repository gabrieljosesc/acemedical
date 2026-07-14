import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { HomeProduct } from "@/lib/home-data";

export default function BestSellers({ products }: { products: HomeProduct[] }) {
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
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: HomeProduct }) {
  const isLow = product.stockLabel === "low-stock";
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group bg-card border border-line rounded-[4px] overflow-hidden flex flex-col hover:border-line-strong hover:shadow-[0_20px_40px_-34px_rgba(8,40,32,0.5)] transition-all"
    >
      <div className="h-[126px] border-b border-line relative flex items-center justify-center bg-gradient-to-br from-teal-tint to-transparent">
        <span
          className={`absolute top-2.5 left-2.5 font-mono text-[9px] tracking-wide px-1.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
            isLow ? "bg-low-bg text-low" : "bg-stock-bg text-stock"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isLow ? "bg-low" : "bg-stock"}`} />
          {isLow ? "Low stock" : "In stock"}
        </span>
        <div className="w-[34px] h-[74px] border-[1.5px] border-teal rounded-[3px] bg-teal/10 relative">
          <span className="absolute left-1.5 right-1.5 top-3 h-0.5 bg-teal opacity-55 shadow-[0_7px_0_var(--color-teal),0_14px_0_var(--color-teal)]" />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="font-mono text-[9.5px] tracking-wide uppercase text-ink-faint mb-1.5">
          {product.categoryLabel} · {product.sku}
        </div>
        <h3 className="font-serif text-[17px] tracking-tight leading-tight">{product.name}</h3>
        <div className="text-[12.5px] text-ink-faint mt-0.5">{product.brand}</div>
        {product.specLine && (
          <div className="font-mono tabular text-[11px] text-ink-soft mt-2.5">{product.specLine}</div>
        )}
        <div className="mt-auto pt-3.5 flex items-center justify-between gap-2.5">
          <span className="font-mono tabular text-[19px] text-amber">{formatPrice(product.price)}</span>
          <span className="border border-teal text-teal rounded-sm px-3.5 py-2 text-[12.5px] font-medium group-hover:bg-teal group-hover:text-[#F4FBF8] transition-colors">
            Add
          </span>
        </div>
      </div>
    </Link>
  );
}
