"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

export default function WishlistBadge() {
  const { count } = useWishlist();

  return (
    <Link
      href="/wishlist"
      aria-label="Wishlist"
      className="relative hidden sm:inline-flex items-center justify-center border border-line bg-card rounded-sm px-2.5 py-2 text-ink hover:border-line-strong transition-colors"
    >
      <Heart size={16} />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 font-mono tabular text-[9px] bg-low text-[#FDF3EE] rounded-full px-1 py-0.5 leading-none min-w-[14px] text-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
