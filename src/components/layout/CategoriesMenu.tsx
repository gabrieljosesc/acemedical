"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import type { ShopFilterOption } from "@/lib/shop-products";

export default function CategoriesMenu({ categories }: { categories: ShopFilterOption[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink py-1.5 transition-colors"
      >
        Brands
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-[560px] bg-card border border-line rounded-sm shadow-[0_16px_36px_-14px_rgba(8,40,32,0.28)] p-4 z-50">
          <p className="font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-2 pb-2">
            Shop by category
          </p>
          <div className="grid grid-cols-3 gap-x-2 gap-y-0.5">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="rounded-sm px-2 py-2 text-[13px] text-ink-soft hover:bg-surface hover:text-teal transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <Link
            href="/shop"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-sm bg-teal-tint text-teal text-[13px] font-medium px-3 py-2.5 hover:bg-teal hover:text-[#F4FBF8] transition-colors"
          >
            View all products
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
