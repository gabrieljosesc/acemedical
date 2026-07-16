"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Suggestion = { id: string; slug: string; name: string; price: number; image: string | null };

export default function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        setResults(json.results ?? []);
        setOpen(true);
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/shop?search=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="relative hidden md:block" ref={ref}>
      <form
        onSubmit={submit}
        className="flex items-center gap-2 bg-card border border-line rounded-sm px-3 py-2 w-[210px] text-ink-faint focus-within:border-teal transition-colors"
      >
        <Search size={15} className="shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search products or SKU"
          className="border-0 bg-transparent outline-none text-[13.5px] text-ink w-full placeholder:text-ink-faint"
        />
      </form>

      {open && results.length > 0 && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-card border border-line rounded-sm shadow-[0_16px_36px_-14px_rgba(8,40,32,0.28)] py-1.5 z-50">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/product/${r.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-surface transition-colors"
            >
              <span className="w-9 h-9 rounded-sm border border-line bg-card relative overflow-hidden shrink-0">
                {r.image && <Image src={r.image} alt="" fill className="object-contain p-0.5" sizes="36px" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-ink truncate">{r.name}</span>
                <span className="font-mono tabular text-[11.5px] text-amber">{formatPrice(r.price)}</span>
              </span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/shop?search=${encodeURIComponent(q.trim())}`);
            }}
            className="block w-full text-left px-3 py-2 text-[12.5px] text-teal hover:bg-surface transition-colors border-t border-line mt-1"
          >
            See all results for “{q.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
