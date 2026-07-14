import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";

const NAV_LINKS = [
  { href: "/shop/dermal-fillers", label: "Dermal fillers" },
  { href: "/shop/botulinum-toxins", label: "Botulinum toxins" },
  { href: "/shop/orthopedic-injections", label: "Orthopedic" },
  { href: "/shop/threads", label: "Threads" },
  { href: "/shop", label: "Brands" },
];

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50">
      <div className="bg-teal-deep text-[#EAF4F0] font-mono text-[11.5px] tracking-wide">
        <div className="mx-auto max-w-[1180px] flex flex-wrap items-center justify-center gap-6 px-5 sm:px-10 py-2">
          <span>Free shipping on trade orders over $500</span>
          <span className="opacity-50">·</span>
          <span>100% authentic, brand-name stock</span>
          <span className="opacity-50 hidden sm:inline">·</span>
          <span className="hidden sm:inline">Cold-chain dispatch within 24 hours</span>
        </div>
      </div>

      <header className="bg-ground/90 backdrop-blur-md border-b border-line">
        <div className="mx-auto max-w-[1180px] flex items-center gap-6 px-5 sm:px-10 py-4">
          <Link href="/" className="flex items-baseline gap-2.5 shrink-0">
            <span className="font-serif font-semibold text-[23px] tracking-tight text-ink leading-none">
              Ace<span className="text-teal">Medical</span>
            </span>
            <span className="font-mono text-[9.5px] tracking-[0.22em] uppercase text-ink-faint border-l border-line-strong pl-2.5">
              Wholesale
            </span>
          </Link>

          <nav className="hidden lg:flex gap-5 ml-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-ink-soft hover:text-ink py-1.5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <form
              action="/shop"
              method="get"
              className="hidden md:flex items-center gap-2 bg-card border border-line rounded-sm px-3 py-2 w-[210px] text-ink-faint focus-within:border-teal transition-colors"
            >
              <Search size={15} className="shrink-0" />
              <input
                name="search"
                placeholder="Search products or SKU"
                className="border-0 bg-transparent outline-none text-[13.5px] text-ink w-full placeholder:text-ink-faint"
              />
            </form>
            <button className="hidden sm:inline-flex items-center gap-2 border border-line bg-card rounded-sm px-3 py-2 text-[13px] text-ink hover:border-line-strong transition-colors">
              Trade login
            </button>
            <button className="inline-flex items-center gap-2 border border-line bg-card rounded-sm px-3 py-2 text-[13px] text-ink hover:border-line-strong transition-colors">
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Cart</span>
              <span className="font-mono text-[10px] bg-teal text-white rounded-full px-1.5 py-0.5 leading-none">
                0
              </span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
