import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    n: "1",
    title: "Verify your credentials",
    body: "Upload your practice license — reviewed within one business day.",
  },
  {
    n: "2",
    title: "See trade-net pricing",
    body: "Contract rates and volume tiers appear across the full catalog.",
  },
  {
    n: "3",
    title: "Order cold-chain",
    body: "Temperature-controlled dispatch within 24 hours, fully tracked.",
  },
];

export default function TradeBand() {
  return (
    <section className="bg-teal-deep text-[#EAF4F0]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-12 sm:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <p className="font-mono text-[11px] tracking-[0.13em] uppercase text-[#8FD3C5]">
            For licensed professionals
          </p>
          <h2 className="font-serif font-medium text-[28px] sm:text-[44px] tracking-tight mt-3.5 text-balance">
            Wholesale pricing, once you&apos;re verified.
          </h2>
          <p className="text-[#B9DDD4] text-[16px] max-w-[42ch] mt-4.5 leading-relaxed">
            Ace Medical supplies credentialed clinics and practitioners only.
            Verify your license once and unlock trade-net pricing, volume
            tiers, and net-30 terms.
          </p>
          <Link
            href="/trade/apply"
            className="inline-flex items-center gap-2 rounded-sm bg-[#F4FBF8] text-teal-deep font-medium text-[14.5px] px-5.5 py-3.5 mt-7 hover:bg-[#DFF1EC] transition-colors"
          >
            Apply for a trade account
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex flex-col gap-px bg-white/[0.14] border border-white/[0.16] rounded-[4px] overflow-hidden">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-teal-deep px-5.5 py-5 flex gap-4 items-start">
              <span className="font-mono text-[12px] text-[#7FC9BA] border border-white/[0.28] rounded-full w-[30px] h-[30px] flex items-center justify-center shrink-0">
                {s.n}
              </span>
              <div>
                <div className="text-[15px] font-medium mb-0.5">{s.title}</div>
                <div className="text-[13px] text-[#A9D4CB]">{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
