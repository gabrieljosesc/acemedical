"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { calculateShipping } from "@/lib/shipping";
import { placeOrder } from "@/app/actions/orders";

type Prefill = {
  recipientName: string;
  company: string;
  phone: string;
};

export default function CheckoutForm({ prefill }: { prefill: Prefill }) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shipping, setShipping] = useState({
    recipientName: prefill.recipientName,
    company: prefill.company,
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    phone: prefill.phone,
  });
  const [card, setCard] = useState({ number: "", expMonth: "", expYear: "", cvv: "", nameOnCard: "" });
  const [notes, setNotes] = useState("");

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[560px] px-5 py-24 text-center">
        <ShoppingCart size={36} className="text-ink-faint mx-auto mb-4" />
        <h1 className="font-serif font-medium text-[26px] tracking-tight mb-2">Your cart is empty</h1>
        <p className="text-[14.5px] text-ink-soft mb-7">Add products to your cart before checking out.</p>
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

  const shippingAmount = calculateShipping(subtotal);
  const total = subtotal + shippingAmount;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await placeOrder({
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      shipping,
      card,
      notes,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    clearCart();
    router.push(`/order-confirmed?ref=${result.referenceNumber}`);
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-10">
      <h1 className="font-serif font-medium text-[30px] sm:text-[36px] tracking-tight mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0 flex flex-col gap-8">
          {error && (
            <p className="text-[13.5px] text-low bg-low-bg border border-low/30 rounded-sm px-3.5 py-3">
              {error}
            </p>
          )}

          <section>
            <h2 className="eyebrow mb-4">Shipping address</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Recipient name" value={shipping.recipientName} onChange={(v) => setShipping((s) => ({ ...s, recipientName: v }))} required span2 />
              <Field label="Practice / company" value={shipping.company} onChange={(v) => setShipping((s) => ({ ...s, company: v }))} span2 />
              <Field label="Address line 1" value={shipping.line1} onChange={(v) => setShipping((s) => ({ ...s, line1: v }))} required span2 />
              <Field label="Address line 2" value={shipping.line2} onChange={(v) => setShipping((s) => ({ ...s, line2: v }))} span2 />
              <Field label="City" value={shipping.city} onChange={(v) => setShipping((s) => ({ ...s, city: v }))} required />
              <Field label="State" value={shipping.state} onChange={(v) => setShipping((s) => ({ ...s, state: v }))} required />
              <Field label="ZIP" value={shipping.zip} onChange={(v) => setShipping((s) => ({ ...s, zip: v }))} required />
              <Field label="Phone" type="tel" value={shipping.phone} onChange={(v) => setShipping((s) => ({ ...s, phone: v }))} />
            </div>
          </section>

          <section>
            <h2 className="eyebrow mb-2">Payment</h2>
            <p className="text-[12.5px] text-ink-soft mb-4 flex items-center gap-1.5">
              <Lock size={12} className="text-teal" />
              No card is charged at submit — our team processes payment on your card on file once the order is
              approved.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Name on card" value={card.nameOnCard} onChange={(v) => setCard((c) => ({ ...c, nameOnCard: v }))} required span2 />
              <Field label="Card number" value={card.number} onChange={(v) => setCard((c) => ({ ...c, number: v }))} required span2 />
              <Field label="Expiry month (MM)" value={card.expMonth} onChange={(v) => setCard((c) => ({ ...c, expMonth: v }))} required />
              <Field label="Expiry year (YYYY)" value={card.expYear} onChange={(v) => setCard((c) => ({ ...c, expYear: v }))} required />
              <Field label="Security code" value={card.cvv} onChange={(v) => setCard((c) => ({ ...c, cvv: v }))} required />
            </div>
          </section>

          <section>
            <h2 className="eyebrow mb-4">Order notes (optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Delivery instructions, PO number, etc."
              className="w-full border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors resize-none"
            />
          </section>
        </div>

        <aside className="w-full lg:w-[340px] shrink-0">
          <div className="bg-card border border-line rounded-[4px] p-5 lg:sticky lg:top-24">
            <h2 className="eyebrow mb-4">Order summary</h2>
            <ul className="flex flex-col gap-2.5 mb-4 pb-4 border-b border-line max-h-[220px] overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 text-[13px]">
                  <span className="text-ink-soft truncate">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="font-mono tabular shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-mono tabular">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Shipping</span>
                <span className="font-mono tabular">
                  {shippingAmount === 0 ? "Free" : formatPrice(shippingAmount)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-line">
              <span className="text-[14px] font-medium text-ink">Total</span>
              <span className="font-mono tabular text-[22px] text-amber">{formatPrice(total)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors mt-5 disabled:opacity-60"
            >
              {submitting ? "Placing order…" : "Place order"}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  required,
  span2,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  span2?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${span2 ? "sm:col-span-2" : ""}`}>
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors"
      />
    </label>
  );
}
