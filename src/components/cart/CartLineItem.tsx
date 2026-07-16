"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { lineUnitPrice, type CartItem } from "@/lib/cart";

export default function CartLineItem({ item }: { item: CartItem }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex gap-4 py-5 border-b border-line">
      <Link
        href={`/product/${item.slug}`}
        className={`w-[84px] h-[84px] shrink-0 rounded-sm border border-line relative overflow-hidden flex items-center justify-center ${
          item.image ? "bg-card" : "bg-gradient-to-br from-teal-tint to-transparent"
        }`}
      >
        {item.image ? (
          <Image src={item.image} alt={item.name} fill className="object-contain p-1.5" sizes="84px" />
        ) : (
          <div className="w-[18px] h-[40px] border-[1.5px] border-teal rounded-[3px] bg-teal/10" />
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${item.slug}`} className="font-serif text-[16px] tracking-tight hover:text-teal transition-colors">
              {item.name}
            </Link>
            {item.brand && <div className="text-[12.5px] text-ink-faint mt-0.5">{item.brand}</div>}
            {item.sku && <div className="font-mono text-[10.5px] text-ink-faint mt-1">SKU: {item.sku}</div>}
          </div>
          <button
            type="button"
            onClick={() => removeFromCart(item.id)}
            aria-label="Remove item"
            className="text-ink-faint hover:text-low transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-line-strong rounded-sm">
            <button
              type="button"
              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
              aria-label="Decrease quantity"
              className="px-2.5 py-1.5 hover:bg-surface transition-colors text-ink-soft"
            >
              <Minus size={13} />
            </button>
            <span className="px-3 font-mono tabular text-[13px] min-w-[2rem] text-center">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              aria-label="Increase quantity"
              className="px-2.5 py-1.5 hover:bg-surface transition-colors text-ink-soft"
            >
              <Plus size={13} />
            </button>
          </div>
          <span className="font-mono tabular text-[16px] text-amber">
            {formatPrice(lineUnitPrice(item) * item.quantity)}
            {lineUnitPrice(item) < item.price && (
              <span className="block text-[10px] text-stock text-right">
                {formatPrice(lineUnitPrice(item))}/unit volume price
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
