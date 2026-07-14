import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck, ClipboardCheck } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/shop-products";
import { formatPrice } from "@/lib/utils";
import ProductGallery from "@/components/product/ProductGallery";
import AddToOrder from "@/components/product/AddToOrder";
import ProductCard from "@/components/products/ProductCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categorySlug, product.id, 4);

  const stockCopy =
    product.stockLabel === "in-stock"
      ? "In stock"
      : product.stockLabel === "low-stock"
        ? "Low stock"
        : "Out of stock";

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-10">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-6 flex-wrap">
        <Link href="/" className="hover:text-teal transition-colors">
          Home
        </Link>
        <ChevronRight size={13} />
        <Link href="/shop" className="hover:text-teal transition-colors">
          Shop
        </Link>
        {product.categorySlug && (
          <>
            <ChevronRight size={13} />
            <Link href={`/shop/${product.categorySlug}`} className="hover:text-teal transition-colors">
              {product.categoryLabel}
            </Link>
          </>
        )}
        <ChevronRight size={13} />
        <span className="text-ink truncate max-w-[220px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} categoryLabel={product.categoryLabel} />

        <div>
          {product.categorySlug && (
            <Link
              href={`/shop/${product.categorySlug}`}
              className="eyebrow hover:text-teal transition-colors"
            >
              {product.categoryLabel}
            </Link>
          )}
          <h1 className="font-serif font-medium text-[30px] sm:text-[36px] tracking-tight mt-2 mb-1 text-balance">
            {product.name}
          </h1>
          {product.brand && <p className="text-[14px] text-ink-faint mb-4">{product.brand}</p>}

          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono tabular text-[28px] text-amber">{formatPrice(product.price)}</span>
            <span className="font-mono text-[11px] text-ink-faint tracking-wide">per unit · trade net</span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full mb-6 ${
              product.stockLabel === "in-stock"
                ? "bg-stock-bg text-stock"
                : product.stockLabel === "low-stock"
                  ? "bg-low-bg text-low"
                  : "bg-line text-ink-faint"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                product.stockLabel === "in-stock"
                  ? "bg-stock"
                  : product.stockLabel === "low-stock"
                    ? "bg-low"
                    : "bg-ink-faint"
              }`}
            />
            {stockCopy}
          </span>

          <AddToOrder name={product.name} price={product.price} />

          {product.sku && <p className="font-mono text-[11.5px] text-ink-faint mt-4">SKU: {product.sku}</p>}

          <ul className="flex flex-col gap-2 border-t border-line mt-6 pt-5 text-[13px] text-ink-soft">
            <li className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal shrink-0" />
              Verified authentic stock
            </li>
            <li className="flex items-center gap-2">
              <Truck size={16} className="text-teal shrink-0" />
              Cold-chain shipping, dispatched in 24h
            </li>
            <li className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-teal shrink-0" />
              Trade-net pricing shown — log in for volume tiers
            </li>
          </ul>

          {product.specs.length > 0 && (
            <div className="grid grid-cols-2 gap-px bg-line border border-line rounded-[3px] overflow-hidden mt-6">
              {product.specs.map((s) => (
                <div key={s.label} className="bg-card px-3.5 py-3">
                  <div className="font-mono text-[9.5px] tracking-wide uppercase text-ink-faint mb-0.5">
                    {s.label}
                  </div>
                  <div className="font-mono text-[14px] text-ink tabular">{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {product.description && (
            <p className="text-[14.5px] text-ink-soft leading-relaxed mt-6 max-w-[56ch]">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 pt-10 border-t border-line">
          <p className="eyebrow mb-2">More from {product.categoryLabel}</p>
          <h2 className="font-serif font-medium text-[24px] tracking-tight mb-6">You may also need</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
