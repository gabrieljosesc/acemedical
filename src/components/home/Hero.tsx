import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, ClipboardCheck, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { HeroProduct } from "@/lib/home-data";

export default function Hero({ product }: { product: HeroProduct }) {
  return (
    <section className="pt-10 sm:pt-16 pb-10 sm:pb-14">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10 grid lg:grid-cols-[1.15fr_.85fr] gap-10 lg:gap-16 items-center">
        <div>
          <p className="eyebrow">Specialty medical &amp; aesthetic supply</p>
          <h1 className="font-serif font-medium text-[38px] sm:text-[52px] lg:text-[62px] leading-[1.08] tracking-tight text-balance mt-3">
            Brand-name injectables at{" "}
            <em className="not-italic font-serif italic text-teal">true trade prices.</em>
          </h1>
          <p className="text-[17.5px] text-ink-soft max-w-[44ch] mt-5 mb-7 leading-relaxed">
            The wholesale catalog for licensed clinics — dermal fillers,
            orthopaedic injectables, and botulinum toxins, sourced authentic
            and shipped cold-chain across the country.
          </p>

          <div className="flex gap-3 flex-wrap mb-7">
            <Link
              href="/trade/apply"
              className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors"
            >
              Open a trade account
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-sm border border-line-strong text-ink font-medium text-[14.5px] px-5.5 py-3.5 hover:border-ink-soft transition-colors"
            >
              Browse the catalog
            </Link>
          </div>

          <ul className="flex gap-6 flex-wrap border-t border-line pt-5 text-[13px] text-ink-soft">
            <li className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-teal shrink-0" />
              Verified authentic stock
            </li>
            <li className="flex items-center gap-2">
              <Truck size={17} className="text-teal shrink-0" />
              Temperature-controlled shipping
            </li>
            <li className="flex items-center gap-2">
              <ClipboardCheck size={17} className="text-teal shrink-0" />
              Licensed practitioners only
            </li>
          </ul>
        </div>

        <SpecCard product={product} />
      </div>
    </section>
  );
}

function SpecCard({ product }: { product: HeroProduct }) {
  return (
    <article className="bg-card border border-line-strong rounded-[4px] overflow-hidden shadow-[0_1px_0_var(--color-line),0_24px_48px_-32px_rgba(8,40,32,0.4)]">
      <div className="h-[180px] bg-gradient-to-b from-teal-tint to-transparent border-b border-line flex items-end justify-center relative">
        <div className="w-[52px] h-[150px] relative -mb-px">
          <span className="absolute left-4 right-4 top-0 h-5 bg-teal rounded-[3px]" />
          <span className="absolute left-5 right-5 top-5 h-[18px] bg-teal/20 border-x border-t border-teal" />
          <span className="absolute left-2 right-2 top-[34px] bottom-0 bg-teal/[0.22] border border-teal rounded-t-[6px] rounded-b-[8px]" />
          <span className="absolute left-2.5 right-2.5 bottom-[3px] h-16 bg-teal/85 rounded-[3px]" />
        </div>
      </div>

      <div className="px-5.5 pt-5 pb-5.5">
        <div className="flex justify-between items-center mb-3">
          <span className="eyebrow">
            {product.categoryLabel} · {product.sku}
          </span>
          <span className="font-mono text-[10px] tracking-wide px-2.5 py-0.5 rounded-full bg-stock-bg text-stock inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-stock" />
            In stock
          </span>
        </div>

        <h3 className="font-serif text-[23px] tracking-tight mb-0.5">{product.name}</h3>
        <p className="text-[13px] text-ink-faint mb-4">{product.brand}</p>

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

        <div className="flex items-center justify-between gap-3.5">
          <div className="font-mono tabular">
            <span className="text-[27px] text-amber tracking-tight">{formatPrice(product.price)}</span>
            <span className="block text-[11px] text-ink-faint tracking-wide mt-px">
              per box · trade net
            </span>
          </div>
          <button className="bg-teal text-[#F4FBF8] rounded-sm px-5 py-3 font-medium text-[14px] inline-flex gap-2 items-center hover:bg-teal-deep transition-colors">
            Add to order
            <Plus size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
