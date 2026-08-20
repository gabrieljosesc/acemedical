import Link from "next/link";
import { getAuthUser, getAdminUser } from "@/lib/supabase/auth";
import { getShopFilterOptions } from "@/lib/shop-products";
import CartBadge from "@/components/layout/CartBadge";
import SearchBar from "@/components/layout/SearchBar";
import MobileMenu from "@/components/layout/MobileMenu";
import WishlistBadge from "@/components/layout/WishlistBadge";
import AccountMenu from "@/components/layout/AccountMenu";
import CategoriesMenu from "@/components/layout/CategoriesMenu";
import Logo from "@/components/layout/Logo";

const NAV_LINKS = [
  { href: "/shop/dermal-fillers", label: "Dermal fillers" },
  { href: "/shop/botulinum-toxins", label: "Botulinum toxins" },
  { href: "/shop/rheumatology", label: "Rheumatology" },
  { href: "/shop/orthopedic-injections", label: "Orthopedic" },
  { href: "/shop/gynecology", label: "Gynecology" },
  { href: "/peptides", label: "Peptides" },
];

// Categories already pinned in the top bar; the dropdown shows the rest.
const TOP_NAV_SLUGS = new Set([
  "dermal-fillers",
  "botulinum-toxins",
  "rheumatology",
  "orthopedic-injections",
  "gynecology",
  "peptides",
]);

export default async function Navbar() {
  const [user, { categories }] = await Promise.all([getAuthUser(), getShopFilterOptions()]);
  const adminUser = user ? await getAdminUser() : null;
  const firstName =
    (user?.user_metadata?.first_name as string | undefined) || user?.email?.split("@")[0] || "";

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-teal-deep text-[#EAF4F0] font-mono text-[11.5px] tracking-wide">
        <div className="mx-auto max-w-[1180px] flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 sm:px-10 py-2">
          <a href="tel:+18004651525" className="hover:text-[#8FD3C5] transition-colors">
            1-800-465-1525
          </a>
          <span className="order-first w-full text-center sm:order-none sm:w-auto">
            Your first order ships free — then free on orders $800+!
          </span>
          <a href="mailto:info@acemedicalwholesale.com" className="hidden sm:inline hover:text-[#8FD3C5] transition-colors">
            info@acemedicalwholesale.com
          </a>
        </div>
      </div>

      <header className="bg-ground/90 backdrop-blur-md border-b border-line">
        <div className="mx-auto max-w-[1180px] flex items-center gap-6 px-5 sm:px-10 py-4">
          <Link href="/" className="flex shrink-0">
            <Logo />
          </Link>

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

        <nav className="hidden lg:block border-t border-line">
          <div className="mx-auto max-w-[1180px] flex items-center gap-6 px-5 sm:px-10">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm whitespace-nowrap text-ink-soft hover:text-ink py-2.5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <CategoriesMenu categories={categories.filter((c) => !TOP_NAV_SLUGS.has(c.slug))} />
          </div>
        </nav>
      </header>
    </div>
  );
}
