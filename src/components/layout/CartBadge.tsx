"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function CartBadge() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="inline-flex items-center gap-2 border border-line bg-card rounded-sm px-3 py-2 text-[13px] text-ink hover:border-line-strong transition-colors"
    >
      <ShoppingCart size={16} />
      <span className="hidden sm:inline">Cart</span>
      <span className="font-mono tabular text-[10px] bg-teal text-white rounded-full px-1.5 py-0.5 leading-none min-w-[16px] text-center">
        {count}
      </span>
    </Link>
  );
}
