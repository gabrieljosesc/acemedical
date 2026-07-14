import Link from "next/link";
import type { ShopParams } from "@/components/shop/ShopFilters";

const OPTIONS: { value: string; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "best-selling", label: "Best selling" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name A–Z" },
];

export default function SortLinks({ pathname, current }: { pathname: string; current: ShopParams }) {
  const currentSort = current.sort ?? "latest";

  function buildUrl(sort: string) {
    const merged: ShopParams = { ...current, sort };
    const qs = Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="font-mono text-[11px] text-ink-faint mr-1">Sort:</span>
      {OPTIONS.map((o) => (
        <Link
          key={o.value}
          href={buildUrl(o.value)}
          className={`text-[12.5px] px-2.5 py-1 rounded-sm transition-colors ${
            currentSort === o.value ? "bg-teal text-[#F4FBF8] font-medium" : "text-ink-soft hover:bg-surface"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
