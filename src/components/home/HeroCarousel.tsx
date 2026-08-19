"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { HeroProduct } from "@/lib/home-data";
import AddToCartButton from "@/components/products/AddToCartButton";

const ROTATE_MS = 6000;

export default function HeroCarousel({ products }: { products: HeroProduct[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;
  const many = count > 1;

  useEffect(() => {
    if (!many || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [many, paused, count]);

  if (count === 0) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative">
        <div className="grid">
          {products.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "col-start-1 row-start-1 transition-opacity duration-500",
                i === index ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              aria-hidden={i !== index}
            >
              <SpecCard product={p} eager={i === 0} />
            </div>
          ))}
        </div>

        {many && (
          <>
            <button
              type="button"
              aria-label="Previous product"
              onClick={() => setIndex((index - 1 + count) % count)}
              className="absolute left-3 top-[110px] -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 border border-line-strong text-ink-soft inline-flex items-center justify-center hover:text-ink hover:border-teal transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next product"
              onClick={() => setIndex((index + 1) % count)}
              className="absolute right-3 top-[110px] -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 border border-line-strong text-ink-soft inline-flex items-center justify-center hover:text-ink hover:border-teal transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {many && (
        <div className="flex justify-center gap-2 mt-4">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Show ${p.name}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-teal" : "w-1.5 bg-line-strong hover:bg-ink-faint"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SpecCard({ product, eager }: { product: HeroProduct; eager: boolean }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      aria-label={`View ${product.name}`}
      className="block bg-card border border-line-strong rounded-[4px] overflow-hidden shadow-[0_1px_0_var(--color-line),0_24px_48px_-32px_rgba(8,40,32,0.4)] transition-all hover:-translate-y-0.5 hover:border-teal"
    >
      <div
        className={cn(
          "h-[220px] border-b border-line flex items-end justify-center relative",
          product.image ? "bg-card" : "bg-gradient-to-b from-teal-tint to-transparent"
        )}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-4"
            sizes="420px"
            priority={eager}
          />
        ) : (
          <div className="w-[52px] h-[150px] relative -mb-px">
            <span className="absolute left-4 right-4 top-0 h-5 bg-teal rounded-[3px]" />
            <span className="absolute left-5 right-5 top-5 h-[18px] bg-teal/20 border-x border-t border-teal" />
            <span className="absolute left-2 right-2 top-[34px] bottom-0 bg-teal/[0.22] border border-teal rounded-t-[6px] rounded-b-[8px]" />
            <span className="absolute left-2.5 right-2.5 bottom-[3px] h-16 bg-teal/85 rounded-[3px]" />
          </div>
        )}
      </div>

      <div className="px-5.5 pt-5 pb-5.5">
        <div className="flex justify-between items-center mb-3">
          <span className="eyebrow">
            {product.categoryLabel} · {product.sku}
          </span>
          <span
            className={cn(
              "font-mono text-[10px] tracking-wide px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5",
              product.stockLabel === "in-stock"
                ? "bg-stock-bg text-stock"
                : product.stockLabel === "low-stock"
                  ? "bg-low-bg text-low"
                  : "bg-line text-ink-faint"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                product.stockLabel === "in-stock"
                  ? "bg-stock"
                  : product.stockLabel === "low-stock"
                    ? "bg-low"
                    : "bg-ink-faint"
              )}
            />
            {product.stockLabel === "in-stock"
              ? "In stock"
              : product.stockLabel === "low-stock"
                ? "Low stock"
                : "Out of stock"}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="font-serif text-[23px] tracking-tight">{product.name}</h3>
          {product.brand && <p className="text-[13px] text-ink-faint mt-0.5">{product.brand}</p>}
        </div>

        {product.specs.length > 0 && (
          <div className="grid grid-cols-2 gap-px bg-line border border-line rounded-[3px] overflow-hidden mb-4.5">
            {product.specs.map((s) => (
              <div key={s.label} className="bg-card px-3 py-2.5">
                <div className="font-mono text-[9.5px] tracking-wide uppercase text-ink-faint mb-0.5">
                  {s.label}
                </div>
                <div className="font-mono text-[14px] text-ink tabular">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3.5">
          <div className="font-mono tabular">
            <span className="text-[27px] text-amber tracking-tight">{formatPrice(product.price)}</span>
            <span className="block text-[11px] text-ink-faint tracking-wide mt-px">per box</span>
          </div>
          <AddToCartButton
            product={product}
            className="bg-teal text-[#F4FBF8] rounded-sm px-5 py-3 font-medium text-[14px] inline-flex gap-2 items-center hover:bg-teal-deep transition-colors"
          >
            Add to order
            <Plus size={15} />
          </AddToCartButton>
        </div>
      </div>
    </Link>
  );
}
