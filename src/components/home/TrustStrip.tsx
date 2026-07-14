import { Truck, Clock, ShieldCheck, BadgeCheck } from "lucide-react";

const ITEMS = [
  {
    icon: Truck,
    title: "Free freight over $500",
    body: "Flat-rate insured delivery on everything else.",
  },
  {
    icon: Clock,
    title: "Dispatched in 24h",
    body: "Cold-chain packed, tracked door to door.",
  },
  {
    icon: ShieldCheck,
    title: "100% authentic",
    body: "Sourced direct, full batch traceability.",
  },
  {
    icon: BadgeCheck,
    title: "Verified accounts",
    body: "Wholesale pricing for credentialed buyers.",
  },
];

export default function TrustStrip() {
  return (
    <div className="border-y border-line bg-surface">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-line sm:divide-y-0">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex gap-3.5 items-start py-5.5 sm:px-6.5 first:pl-0 lg:border-l lg:border-line lg:first:border-l-0"
          >
            <item.icon size={22} className="text-teal shrink-0 mt-0.5" />
            <div>
              <div className="text-[14px] font-medium text-ink mb-0.5">{item.title}</div>
              <div className="text-[12.5px] text-ink-soft leading-snug">{item.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
