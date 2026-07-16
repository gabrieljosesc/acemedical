import Link from "next/link";
import { getTopBrands, type TopBrand } from "@/lib/shop-products";

// A touch of typographic character per wordmark, cycled by position —
// keeps the slideshow lively without leaving the site's type system.
const WORDMARK_STYLES = [
  "font-serif font-semibold tracking-tight",
  "font-serif italic",
  "font-serif font-medium tracking-tight",
  "font-mono uppercase tracking-[0.18em] text-[17px]",
];

export default async function Brands() {
  const brands = await getTopBrands(12);
  if (brands.length === 0) return null;

  return (
    <section className="border-y border-line bg-surface overflow-hidden">
      <div className="py-10">
        <div className="text-center font-mono text-[11px] tracking-[0.14em] uppercase text-ink-faint mb-6">
          Trusted brands we carry
        </div>

        <div className="group relative">
          <div
            className="flex w-max gap-3.5 motion-safe:animate-[brand-marquee_45s_linear_infinite] group-hover:[animation-play-state:paused]"
            aria-label="Brands we carry"
          >
            <BrandCards brands={brands} />
            <BrandCards brands={brands} ariaHidden />
          </div>

          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-surface to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface to-transparent" />
        </div>
      </div>
    </section>
  );
}

function BrandCards({ brands, ariaHidden }: { brands: TopBrand[]; ariaHidden?: boolean }) {
  return (
    <div className="flex gap-3.5" aria-hidden={ariaHidden || undefined}>
      {brands.map((brand, i) => (
        <Link
          key={`${brand.slug}${ariaHidden ? "-copy" : ""}`}
          href={`/shop?brand=${brand.slug}`}
          tabIndex={ariaHidden ? -1 : undefined}
          className="w-[190px] shrink-0 bg-card border border-line rounded-[4px] px-5 py-5 text-center hover:border-teal hover:-translate-y-0.5 transition-all"
        >
          <span className={`block text-[21px] leading-tight text-ink ${WORDMARK_STYLES[i % WORDMARK_STYLES.length]}`}>
            {brand.name}
          </span>
          <span className="block font-mono tabular text-[11px] text-ink-soft mt-2">
            <span className="text-teal font-medium">{brand.count}</span> products in the catalog
          </span>
        </Link>
      ))}
    </div>
  );
}
