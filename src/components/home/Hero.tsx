import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, ClipboardCheck } from "lucide-react";
import type { HeroProduct } from "@/lib/home-data";
import HeroCarousel from "@/components/home/HeroCarousel";

export default function Hero({ products }: { products: HeroProduct[] }) {
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
            orthopedic injections, and botulinum toxins, sourced authentic
            and shipped cold-chain across the country.
          </p>

          <div className="flex gap-3 flex-wrap mb-7">
            <Link
              href="/trade/apply"
              className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors"
            >
              Create an account
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

        <HeroCarousel products={products} />
      </div>
    </section>
  );
}
