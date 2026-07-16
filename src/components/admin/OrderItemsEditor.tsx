"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { saveOrderItemsAction, type EditableOrderItem } from "@/app/actions/admin-orders";
import { formatPrice } from "@/lib/utils";

export default function OrderItemsEditor({
  orderId,
  initialItems,
  initialShipping,
}: {
  orderId: string;
  initialItems: EditableOrderItem[];
  initialShipping: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [shipping, setShipping] = useState(String(initialShipping));
  const [pending, startTransition] = useTransition();

  const subtotal = items.reduce((sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);
  const shippingNum = Math.max(0, Number(shipping) || 0);
  const total = subtotal + shippingNum;

  function updateItem(index: number, patch: Partial<EditableOrderItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveOrderItemsAction({
        orderId,
        items: items.map((i) => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        shippingAmount: shippingNum,
      });
      if (result.ok) {
        toast.success(result.message ?? "Items updated");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <section className="bg-card border border-line rounded-[4px] p-5">
      <h2 className="eyebrow mb-4">Items</h2>

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <span className="flex-1 min-w-0 text-[13.5px] text-ink truncate" title={item.productName}>
              {item.productName}
            </span>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
              aria-label="Quantity"
              className="w-[64px] border border-line rounded-sm px-2 py-1.5 text-[13px] font-mono tabular bg-card outline-none focus:border-teal transition-colors text-center"
            />
            <span className="text-ink-faint text-[12px]">×</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
              aria-label="Unit price"
              className="w-[92px] border border-line rounded-sm px-2 py-1.5 text-[13px] font-mono tabular bg-card outline-none focus:border-teal transition-colors text-right"
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              aria-label="Remove item"
              className="text-ink-faint hover:text-low transition-colors shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-[13px] text-low">
            All items removed — an order needs at least one item to save.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-line text-[13.5px]">
        <span className="text-ink-soft">Shipping</span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={shipping}
          onChange={(e) => setShipping(e.target.value)}
          aria-label="Shipping amount"
          className="w-[92px] border border-line rounded-sm px-2 py-1.5 text-[13px] font-mono tabular bg-card outline-none focus:border-teal transition-colors text-right"
        />
      </div>

      <div className="flex justify-between items-baseline mt-3 text-[13.5px]">
        <span className="text-ink-soft">
          New total <span className="text-ink-faint">(subtotal {formatPrice(subtotal)})</span>
        </span>
        <span className="font-mono tabular text-[16px] text-amber">{formatPrice(total)}</span>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending || items.length === 0}
        className="mt-4 rounded-sm border border-teal text-teal font-medium text-[13px] px-4 py-2 hover:bg-teal hover:text-[#F4FBF8] transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save items & totals"}
      </button>
    </section>
  );
}
