"use client";

import { formatPrice } from "@/lib/utils";
import { MIN_CHECKOUT_SUBTOTAL_USD, meetsCheckoutMinimumUsd } from "@/lib/cart-minimum";

export default function CartMinimumBar({ amountUsd }: { amountUsd: number }) {
  const met = meetsCheckoutMinimumUsd(amountUsd);
  const pct = Math.min(100, Math.round((amountUsd / MIN_CHECKOUT_SUBTOTAL_USD) * 100));
  const remaining = Math.max(0, MIN_CHECKOUT_SUBTOTAL_USD - amountUsd);

  return (
    <div className="mb-4 pb-4 border-b border-line">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-mono text-[10.5px] tracking-wide uppercase text-ink-faint">
          {formatPrice(MIN_CHECKOUT_SUBTOTAL_USD)} order minimum
        </span>
        <span className={`text-[12px] font-medium ${met ? "text-stock" : "text-low"}`}>
          {met ? "Minimum met" : `${formatPrice(remaining)} to go`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward the order minimum"
        className="h-1.5 rounded-full bg-line overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all ${met ? "bg-stock" : "bg-teal"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
