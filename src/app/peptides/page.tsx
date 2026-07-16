import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FlaskConical, ShieldCheck, Snowflake } from "lucide-react";
import { getShopProducts } from "@/lib/shop-products";
import ProductCard from "@/components/products/ProductCard";

export const metadata: Metadata = {
  title: "Peptides",
  description:
    "Research-grade peptides for licensed professionals — third-party tested, cold-chain shipped, with volume pricing on every vial.",
};

const FEATURES = [
  {
    icon: FlaskConical,
    title: "Research-grade purity",
    body: "Every batch is third-party tested, with certificates of analysis available on the product page.",
  },
  {
    icon: Snowflake,
    title: "Cold-chain handled",
    body: "Lyophilized vials packed and dispatched within 24 hours, tracked door to door.",
  },
  {
    icon: ShieldCheck,
    title: "Licensed accounts only",
    body: "Supplied to verified professionals — with volume pricing that scales as you order.",
  },
];

export default async function PeptidesPage() {
  const { products, count } = await getShopProducts({
    category: "peptides",
    sort: "name_asc",
    page: 1,
    pageSize: 12,
  });

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-12 sm:py-16">
      <div className="max-w-[640px]">
        <p className="eyebrow">Catalog</p>
        <h1 className="font-serif font-medium text-[36px] sm:text-[48px] tracking-tight text-balance mt-2">
          Peptides, <em className="not-italic font-serif italic text-teal">tested and titrated.</em>
        </h1>
        <p className="text-[16.5px] text-ink-soft mt-4 leading-relaxed">
          {count} research-grade peptides across recovery, metabolic, and cosmetic protocols — most
          available in multiple strengths, all with trade-net pricing and volume tiers.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3.5 mt-9">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-card border border-line rounded-[4px] p-5">
            <f.icon size={22} className="text-teal mb-3" />
            <h2 className="text-[15px] font-medium text-ink mb-1">{f.title}</h2>
            <p className="text-[12.5px] text-ink-soft leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-end gap-6 flex-wrap mt-12 mb-6">
        <h2 className="font-serif font-medium text-[24px] tracking-tight">Browse peptides</h2>
        <Link
          href="/shop/peptides"
          className="font-mono text-[12px] tracking-wide text-teal inline-flex gap-1.5 items-center whitespace-nowrap border-b border-transparent hover:border-teal pb-0.5 transition-colors"
        >
          All {count} peptides
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
