import Link from "next/link";
import { getAuthUser, getAdminUser } from "@/lib/supabase/auth";
import { getShopFilterOptions } from "@/lib/shop-products";
import CartBadge from "@/components/layout/CartBadge";
import SearchBar from "@/components/layout/SearchBar";
import MobileMenu from "@/components/layout/MobileMenu";
import WishlistBadge from "@/components/layout/WishlistBadge";
import AccountMenu from "@/components/layout/AccountMenu";
import CategoriesMenu from "@/components/layout/CategoriesMenu";

const NAV_LINKS = [
  { href: "/shop/dermal-fillers", label: "Dermal fillers" },
  { href: "/shop/botulinum-toxins", label: "Botulinum toxins" },
  { href: "/shop/orthopedic-injections", label: "Orthopedic" },
  { href: "/shop/threads", label: "Threads" },
  { href: "/peptides", label: "Peptides" },
];

export default async function Navbar() {
  const [user, { categories }] = await Promise.all([getAuthUser(), getShopFilterOptions()]);
  const adminUser = user ? await getAdminUser() : null;
  const firstName =
    (user?.user_metadata?.first_name as string | undefined) || user?.email?.split("@")[0] || "";

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
          <Link href="/" className="flex flex-col shrink-0">
            <span className="font-serif font-semibold text-[23px] tracking-tight text-ink leading-none">
              Ace<span className="text-teal">Medical</span>
            </span>
            <span className="font-mono text-[9px] uppercase text-ink-faint tracking-[0.53em] -mr-[0.53em] mt-1 leading-none">
              Wholesale
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 ml-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-ink-soft hover:text-ink py-1.5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <CategoriesMenu categories={categories} />
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <SearchBar />

            {user ? (
              <AccountMenu firstName={firstName} isAdmin={!!adminUser} />
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex items-center gap-2 border border-line bg-card rounded-sm px-3 py-2 text-[13px] text-ink hover:border-line-strong transition-colors"
              >
                Trade login
              </Link>
            )}

            <WishlistBadge />
            <CartBadge />
            <MobileMenu categories={categories} signedIn={!!user} />
          </div>
        </div>
      </header>
    </div>
  );
}
