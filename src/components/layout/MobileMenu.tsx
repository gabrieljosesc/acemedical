"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { ShopFilterOption } from "@/lib/shop-products";

export default function MobileMenu({
  categories,
  signedIn,
}: {
  categories: ShopFilterOption[];
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const link = "block px-4 py-2.5 text-[14px] text-ink-soft hover:bg-surface hover:text-ink transition-colors";

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="inline-flex items-center justify-center border border-line bg-card rounded-sm px-2.5 py-2 text-ink"
      >
        <Menu size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-ink/40" onClick={close} />
          <div className="absolute left-0 top-0 bottom-0 w-[290px] bg-card border-r border-line overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-line">
              <span className="font-serif font-semibold text-[18px] text-ink">
                Ace<span className="text-teal">Medical</span>
              </span>
              <button type="button" onClick={close} aria-label="Close menu" className="text-ink-faint hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <p className="eyebrow px-4 pt-4 pb-1">Shop by category</p>
            {categories.map((c) => (
              <Link key={c.slug} href={`/shop/${c.slug}`} onClick={close} className={link}>
                {c.name}
              </Link>
            ))}
            <Link href="/shop" onClick={close} className={`${link} text-teal font-medium`}>
              All products →
            </Link>

            <p className="eyebrow px-4 pt-5 pb-1">Company</p>
            <Link href="/about" onClick={close} className={link}>About us</Link>
            <Link href="/faq" onClick={close} className={link}>FAQ</Link>
            <Link href="/shipping" onClick={close} className={link}>Shipping</Link>
            <Link href="/contact" onClick={close} className={link}>Contact us</Link>

            <p className="eyebrow px-4 pt-5 pb-1">Account</p>
            {signedIn ? (
              <>
                <Link href="/account/profile" onClick={close} className={link}>My account</Link>
                <Link href="/account/orders" onClick={close} className={link}>My orders</Link>
                <Link href="/wishlist" onClick={close} className={link}>Wishlist</Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={close} className={link}>Trade login</Link>
                <Link href="/auth/signup" onClick={close} className={link}>Apply for a trade account</Link>
              </>
            )}
            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
