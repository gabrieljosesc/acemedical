"use client";

import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { calculateShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import CartLineItem from "@/components/cart/CartLineItem";

export default function CartPage() {
  const { items, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[560px] px-5 py-24 text-center">
        <ShoppingCart size={36} className="text-ink-faint mx-auto mb-4" />
        <h1 className="font-serif font-medium text-[26px] tracking-tight mb-2">Your cart is empty</h1>
        <p className="text-[14.5px] text-ink-soft mb-7">
          Browse the catalog and add products to start an order.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors"
        >
          Browse the catalog
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-10">
      <h1 className="font-serif font-medium text-[30px] sm:text-[36px] tracking-tight mb-8">Your cart</h1>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0">
          {items.map((item) => (
            <CartLineItem key={item.id} item={item} />
          ))}
        </div>

        <aside className="w-full lg:w-[340px] shrink-0">
          <div className="bg-card border border-line rounded-[4px] p-5 lg:sticky lg:top-24">
            <h2 className="eyebrow mb-4">Order summary</h2>

            {remainingForFreeShipping > 0 ? (
              <p className="text-[12.5px] text-ink-soft mb-4 pb-4 border-b border-line">
                Add <span className="text-teal font-medium">{formatPrice(remainingForFreeShipping)}</span> more
                for free shipping.
              </p>
            ) : (
              <p className="text-[12.5px] text-stock mb-4 pb-4 border-b border-line">
                Your order qualifies for free shipping.
              </p>
            )}

            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-mono tabular">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Shipping</span>
                <span className="font-mono tabular">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-line">
              <span className="text-[14px] font-medium text-ink">Total</span>
              <span className="font-mono tabular text-[22px] text-amber">{formatPrice(total)}</span>
            </div>

            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors mt-5"
            >
              Proceed to checkout
              <ArrowRight size={16} />
            </Link>

            <p className="text-[11.5px] text-ink-faint text-center mt-3">
              Trade-net pricing shown. Verified accounts unlock volume tiers.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
