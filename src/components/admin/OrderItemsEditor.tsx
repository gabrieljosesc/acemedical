"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { saveOrderItemsAction, type EditableOrderItem } from "@/app/actions/admin-orders";
import { formatPrice } from "@/lib/utils";

type Suggestion = { id: string; slug: string; name: string; price: number; image: string | null };

export default function OrderItemsEditor({
  orderId,
  initialItems,
  initialShipping,
  initialDiscount,
}: {
  orderId: string;
  initialItems: EditableOrderItem[];
  initialShipping: number;
  initialDiscount: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [shipping, setShipping] = useState(String(initialShipping));
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState(String(initialDiscount));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subtotal = items.reduce((sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);
  const shippingNum = Math.max(0, Number(shipping) || 0);
  const discountNum = Math.max(0, Number(discountValue) || 0);
  const discountAmount =
    Math.round(Math.min(subtotal, discountType === "percent" ? (subtotal * discountNum) / 100 : discountNum) * 100) /
    100;
  const total = Math.max(0, subtotal - discountAmount) + shippingNum;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        // ignore — the admin can retype to retry
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function addProduct(s: Suggestion) {
    setItems((prev) => [
      ...prev,
      { productId: s.id, productName: s.name, productImage: s.image, quantity: 1, unitPrice: s.price },
    ]);
    setQuery("");
    setResults([]);
  }

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
        discountAmount,
      });
      if (result.ok) {
        toast.success(result.message ?? "Order updated");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <section className="bg-card border border-line rounded-[4px] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="eyebrow">Items (editable)</h2>
        <span className="text-[11.5px] text-ink-faint">
          Adjust quantity or price, add or remove products.
        </span>
      </div>

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
            <span className="w-[76px] text-right font-mono tabular text-[13px] text-ink shrink-0">
              {formatPrice((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0))}
            </span>
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
          <p className="text-[13px] text-low">No items — add a product below.</p>
        )}
      </div>

      <div className="relative mt-3">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Add a product — search by name or SKU…"
          className="w-full border border-line rounded-sm pl-9 pr-8 py-2 text-[13px] bg-card outline-none focus:border-teal transition-colors"
        />
        {searching && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-faint"
          />
        )}
        {results.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-card border border-line-strong rounded-sm shadow-[0_12px_32px_-16px_rgba(8,40,32,0.4)] max-h-[240px] overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => addProduct(r)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-teal-tint transition-colors"
              >
                <span className="min-w-0 truncate text-ink">{r.name}</span>
                <span className="flex items-center gap-1.5 shrink-0 font-mono tabular text-ink-soft">
                  {formatPrice(r.price)}
                  <Plus size={13} className="text-teal" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 mt-4 pt-4 border-t border-line text-[13.5px]">
        <div className="flex justify-between items-center">
          <span className="text-ink-soft">Subtotal</span>
          <span className="font-mono tabular">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-ink-soft">Discount</span>
          <span className="flex items-center gap-1.5">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "amount" | "percent")}
              aria-label="Discount type"
              className="border border-line rounded-sm px-1 py-1.5 text-[13px] bg-card outline-none focus:border-teal transition-colors"
            >
              <option value="amount">$</option>
              <option value="percent">%</option>
            </select>
            <input
              type="number"
              min={0}
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              aria-label="Discount value"
              className="w-[80px] border border-line rounded-sm px-2 py-1.5 text-[13px] font-mono tabular bg-card outline-none focus:border-teal transition-colors text-right"
            />
            <span className="w-[76px] text-right font-mono tabular text-stock">
              −{formatPrice(discountAmount)}
            </span>
          </span>
        </div>
        <div className="flex justify-between items-center">
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
      </div>

      <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-line text-[13.5px]">
        <span className="text-ink font-medium">Total</span>
        <span className="font-mono tabular text-[16px] text-amber">{formatPrice(total)}</span>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending || items.length === 0}
        className="mt-4 rounded-sm border border-teal text-teal font-medium text-[13px] px-4 py-2 hover:bg-teal hover:text-[#F4FBF8] transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save order changes"}
      </button>
    </section>
  );
}
