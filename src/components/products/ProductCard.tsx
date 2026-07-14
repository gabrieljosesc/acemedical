import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/types";

const STOCK_COPY: Record<CatalogProduct["stockLabel"], string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock",
};

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const { stockLabel } = product;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group bg-card border border-line rounded-[4px] overflow-hidden flex flex-col hover:border-line-strong hover:shadow-[0_20px_40px_-34px_rgba(8,40,32,0.5)] transition-all"
    >
      <div className="h-[126px] border-b border-line relative flex items-center justify-center bg-gradient-to-br from-teal-tint to-transparent">
        <span
          className={`absolute top-2.5 left-2.5 font-mono text-[9px] tracking-wide px-1.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
            stockLabel === "in-stock"
              ? "bg-stock-bg text-stock"
              : stockLabel === "low-stock"
                ? "bg-low-bg text-low"
                : "bg-line text-ink-faint"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              stockLabel === "in-stock" ? "bg-stock" : stockLabel === "low-stock" ? "bg-low" : "bg-ink-faint"
            }`}
          />
          {STOCK_COPY[stockLabel]}
        </span>
        <div className="w-[34px] h-[74px] border-[1.5px] border-teal rounded-[3px] bg-teal/10 relative">
          <span className="absolute left-1.5 right-1.5 top-3 h-0.5 bg-teal opacity-55 shadow-[0_7px_0_var(--color-teal),0_14px_0_var(--color-teal)]" />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="font-mono text-[9.5px] tracking-wide uppercase text-ink-faint mb-1.5">
          {product.categoryLabel}
          {product.sku ? ` · ${product.sku}` : ""}
        </div>
        <h3 className="font-serif text-[17px] tracking-tight leading-tight">{product.name}</h3>
        {product.brand && <div className="text-[12.5px] text-ink-faint mt-0.5">{product.brand}</div>}
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
