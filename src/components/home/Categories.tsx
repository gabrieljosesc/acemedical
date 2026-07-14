import Link from "next/link";
import {
  Syringe,
  Bone,
  FlaskConical,
  Waves,
  Droplet,
  Sparkles,
  Scale,
  TestTubes,
  Eye,
  HeartPulse,
  Venus,
  Stethoscope,
  ShieldPlus,
  Activity,
  Pill,
  ArrowUpRight,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { HomeCategory } from "@/lib/home-data";

const ICONS: Record<string, LucideIcon> = {
  rheumatology: HeartPulse,
  ophthalmology: Eye,
  skincare: Sparkles,
  "peels-and-masks": Droplet,
  "dermal-fillers": Syringe,
  "botulinum-toxins": FlaskConical,
  gynecology: Venus,
  "body-sculpting": Scale,
  osteoporosis: Bone,
  "fat-removal": Activity,
  mesotherapy: TestTubes,
  "orthopedic-injections": Bone,
  peptides: FlaskConical,
  "dermal-filler-removal": Syringe,
  anaesthetics: Pill,
  "weight-loss": Scale,
  "cannulas-and-needles": Syringe,
  asthma: Stethoscope,
  threads: Waves,
  "eyelash-enhancers": Sparkles,
  "prp-kits": TestTubes,
  other: ShieldPlus,
};

export default function Categories({ categories }: { categories: HomeCategory[] }) {
  return (
    <section className="py-12 sm:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <div className="flex justify-between items-end gap-6 flex-wrap mb-8">
          <div>
            <p className="eyebrow">Shop by treatment</p>
            <h2 className="font-serif font-medium text-[26px] sm:text-[38px] tracking-tight mt-2.5 text-balance">
              Every category, one supplier.
            </h2>
            <p className="text-ink-soft text-[15px] max-w-[52ch] mt-2">
              From rheumatology injectables to the full aesthetic range —
              organized the way clinics actually order.
            </p>
          </div>
          <Link
            href="/shop"
            className="font-mono text-[12px] tracking-wide text-teal inline-flex gap-1.5 items-center whitespace-nowrap border-b border-transparent hover:border-teal pb-0.5 transition-colors"
          >
            All {categories.length} categories
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {categories.map((cat, i) => {
            const Icon = ICONS[cat.slug] ?? Syringe;
            return (
              <Link
                key={cat.slug}
                href={`/shop/${cat.slug}`}
                className="group bg-card border border-line rounded-[4px] p-5 flex flex-col min-h-[150px] relative overflow-hidden hover:border-teal hover:-translate-y-0.5 transition-all"
              >
                <span className="font-mono text-[10px] tracking-wide text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon size={26} className="text-teal mt-1.5 mb-auto" />
                <h3 className="font-serif text-[19px] tracking-tight mt-3.5">{cat.name}</h3>
                <span className="font-mono text-[11.5px] text-ink-soft mt-1.5">
                  {cat.productCount} products
                </span>
                <ArrowUpRight
                  size={16}
                  className="absolute top-4.5 right-4.5 text-ink-faint opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-teal transition-all"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
