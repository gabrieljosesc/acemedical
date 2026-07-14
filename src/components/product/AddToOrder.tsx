"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

export default function AddToOrder({ name, price }: { name: string; price: number }) {
  const [qty, setQty] = useState(1);
  const lineTotal = qty * price;

  function handleAdd() {
    toast.success(`${qty} × ${name} added to order`);
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-line-strong rounded-sm">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="px-3 py-3 hover:bg-surface transition-colors text-ink-soft"
          >
            <Minus size={14} />
          </button>
          <span className="px-4 font-mono tabular text-[14px] min-w-[2.5rem] text-center">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="px-3 py-3 hover:bg-surface transition-colors text-ink-soft"
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-teal text-[#F4FBF8] rounded-sm px-5 py-3.5 font-medium text-[14.5px] hover:bg-teal-deep transition-colors"
        >
          <ShoppingCart size={16} />
          Add to order
        </button>
      </div>
      {qty > 1 && (
        <p className="font-mono tabular text-[13px] text-ink-soft mt-2.5">
          {qty} × {formatPrice(price)} = <span className="text-ink font-medium">{formatPrice(lineTotal)}</span>
        </p>
      )}
    </div>
  );
}
