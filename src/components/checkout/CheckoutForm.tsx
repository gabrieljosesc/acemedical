"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShoppingCart, Check, X, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { lineUnitPrice } from "@/lib/cart";
import { calculateShipping } from "@/lib/shipping";
import { meetsCheckoutMinimumUsd } from "@/lib/cart-minimum";
import CartMinimumBar from "@/components/cart/CartMinimumBar";
import { placeOrder } from "@/app/actions/orders";
import { validateCoupon } from "@/app/actions/coupons";
import AddressAutocompleteInput from "@/components/forms/AddressAutocompleteInput";

type Prefill = {
  recipientName: string;
  company: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

const emptyAddress = {
  recipientName: "",
  company: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  phone: "",
};

type AppliedCoupon = { code: string; discount: number };

export type SavedCard = {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  name_on_card: string;
  is_default: boolean;
};

export default function CheckoutForm({
  prefill,
  savedCards,
  isFirstOrder,
}: {
  prefill: Prefill;
  savedCards: SavedCard[];
  isFirstOrder: boolean;
}) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shipping, setShipping] = useState({
    recipientName: prefill.recipientName,
    company: prefill.company,
    line1: prefill.line1,
    line2: prefill.line2,
    city: prefill.city,
    state: prefill.state,
    zip: prefill.zip,
    country: prefill.country || "US",
    phone: prefill.phone,
  });
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState({ ...emptyAddress });
  const [card, setCard] = useState({ number: "", expMonth: "", expYear: "", cvv: "", nameOnCard: "" });
  // Preselect the default (first) saved card; "new" = enter card details inline.
  const [selectedCardId, setSelectedCardId] = useState<string | "new">(savedCards[0]?.id ?? "new");
  const [savedCardCvv, setSavedCardCvv] = useState("");
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [notes, setNotes] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

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

  const discount = coupon?.discount ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shippingAmount = calculateShipping(discountedSubtotal, isFirstOrder);
  const total = discountedSubtotal + shippingAmount;
  const minimumMet = meetsCheckoutMinimumUsd(subtotal);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    const result = await validateCoupon(couponInput, subtotal);
    setApplyingCoupon(false);
    if (result.ok) {
      setCoupon({ code: result.code, discount: result.discount });
      toast.success(`Coupon ${result.code} applied`);
    } else {
      toast.error(result.message);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!policyAccepted) {
      setError("Please confirm the professional-use acknowledgement.");
      return;
    }

    setSubmitting(true);
    const result = await placeOrder({
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      shipping,
      billing: billingSame ? null : billing,
      couponCode: coupon?.code,
      policyAccepted,
      savedCardId: selectedCardId === "new" ? null : selectedCardId,
      savedCardCvv: selectedCardId === "new" ? undefined : savedCardCvv,
      card: selectedCardId === "new" ? card : null,
      saveNewCard: selectedCardId === "new" ? saveNewCard : false,
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
              <AddressAutocompleteInput
                label="Address line 1"
                value={shipping.line1}
                onChange={(v) => setShipping((s) => ({ ...s, line1: v }))}
                onAddressSelect={(a) =>
                  setShipping((s) => ({ ...s, line1: a.line1, city: a.city, state: a.state, zip: a.zip, country: a.country }))
                }
                required
                span2
              />
              <Field label="Address line 2" value={shipping.line2} onChange={(v) => setShipping((s) => ({ ...s, line2: v }))} span2 />
              <Field label="City" value={shipping.city} onChange={(v) => setShipping((s) => ({ ...s, city: v }))} required />
              <Field label="State" value={shipping.state} onChange={(v) => setShipping((s) => ({ ...s, state: v }))} required />
              <Field label="ZIP" value={shipping.zip} onChange={(v) => setShipping((s) => ({ ...s, zip: v }))} required />
              <Field label="Phone" type="tel" value={shipping.phone} onChange={(v) => setShipping((s) => ({ ...s, phone: v }))} />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="eyebrow">Billing address</h2>
              <label className="flex items-center gap-2 cursor-pointer text-[12.5px] text-ink-soft">
                <input
                  type="checkbox"
                  checked={billingSame}
                  onChange={(e) => setBillingSame(e.target.checked)}
                  className="h-4 w-4 accent-teal"
                />
                Same as shipping
              </label>
            </div>
            {!billingSame && (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Recipient name" value={billing.recipientName} onChange={(v) => setBilling((b) => ({ ...b, recipientName: v }))} required span2 />
                <Field label="Practice / company" value={billing.company} onChange={(v) => setBilling((b) => ({ ...b, company: v }))} span2 />
                <AddressAutocompleteInput
                  label="Address line 1"
                  value={billing.line1}
                  onChange={(v) => setBilling((b) => ({ ...b, line1: v }))}
                  onAddressSelect={(a) =>
                    setBilling((b) => ({ ...b, line1: a.line1, city: a.city, state: a.state, zip: a.zip, country: a.country }))
                  }
                  required
                  span2
                />
                <Field label="Address line 2" value={billing.line2} onChange={(v) => setBilling((b) => ({ ...b, line2: v }))} span2 />
                <Field label="City" value={billing.city} onChange={(v) => setBilling((b) => ({ ...b, city: v }))} required />
                <Field label="State" value={billing.state} onChange={(v) => setBilling((b) => ({ ...b, state: v }))} required />
                <Field label="ZIP" value={billing.zip} onChange={(v) => setBilling((b) => ({ ...b, zip: v }))} required />
                <Field label="Phone" type="tel" value={billing.phone} onChange={(v) => setBilling((b) => ({ ...b, phone: v }))} />
              </div>
            )}
          </section>

          <section>
            <h2 className="eyebrow mb-2">Payment</h2>
            <p className="text-[12.5px] text-ink-soft mb-4 flex items-center gap-1.5">
              <Lock size={12} className="text-teal" />
              No card is charged at submit — our team processes payment on your card on file once the order is
              approved.
            </p>
            {savedCards.length > 0 && (
              <div className="flex flex-col gap-2 mb-4">
                {savedCards.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 border rounded-sm px-3.5 py-3 cursor-pointer transition-colors ${
                      selectedCardId === c.id ? "border-teal bg-teal-tint" : "border-line bg-card hover:border-line-strong"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-card"
                      checked={selectedCardId === c.id}
                      onChange={() => setSelectedCardId(c.id)}
                      className="h-4 w-4 accent-teal shrink-0"
                    />
                    <CreditCard size={16} className="text-ink-faint shrink-0" />
                    <span className="text-[13.5px] text-ink">
                      <span className="capitalize font-medium">{c.brand}</span>{" "}
                      <span className="font-mono tabular">•••• {c.last4}</span>
                    </span>
                    <span className="font-mono tabular text-[12px] text-ink-faint ml-auto">
                      {String(c.exp_month).padStart(2, "0")}/{String(c.exp_year).slice(-2)}
                    </span>
                    {c.is_default && (
                      <span className="font-mono text-[10px] tracking-wide uppercase text-teal bg-card border border-teal/30 rounded-full px-2 py-0.5">
                        Default
                      </span>
                    )}
                  </label>
                ))}
                <label
                  className={`flex items-center gap-3 border rounded-sm px-3.5 py-3 cursor-pointer transition-colors ${
                    selectedCardId === "new" ? "border-teal bg-teal-tint" : "border-line bg-card hover:border-line-strong"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-card"
                    checked={selectedCardId === "new"}
                    onChange={() => setSelectedCardId("new")}
                    className="h-4 w-4 accent-teal shrink-0"
                  />
                  <span className="text-[13.5px] text-ink font-medium">Use a new card</span>
                </label>
              </div>
            )}

            {selectedCardId !== "new" ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Security code" value={savedCardCvv} onChange={setSavedCardCvv} required />
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Name on card" value={card.nameOnCard} onChange={(v) => setCard((c) => ({ ...c, nameOnCard: v }))} required span2 />
                  <Field label="Card number" value={card.number} onChange={(v) => setCard((c) => ({ ...c, number: v }))} required span2 />
                  <Field label="Expiry month (MM)" value={card.expMonth} onChange={(v) => setCard((c) => ({ ...c, expMonth: v }))} required />
                  <Field label="Expiry year (YYYY)" value={card.expYear} onChange={(v) => setCard((c) => ({ ...c, expYear: v }))} required />
                  <Field label="Security code" value={card.cvv} onChange={(v) => setCard((c) => ({ ...c, cvv: v }))} required />
                </div>
                <label className="flex items-center gap-2 mt-3 cursor-pointer text-[12.5px] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={saveNewCard}
                    onChange={(e) => setSaveNewCard(e.target.checked)}
                    className="h-4 w-4 accent-teal"
                  />
                  Save this card to my account for faster checkout
                </label>
              </>
            )}
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

            <CartMinimumBar amountUsd={subtotal} />
            <ul className="flex flex-col gap-2.5 mb-4 pb-4 border-b border-line max-h-[200px] overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 text-[13px]">
                  <span className="text-ink-soft truncate">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="font-mono tabular shrink-0">{formatPrice(lineUnitPrice(item) * item.quantity)}</span>
                </li>
              ))}
            </ul>

            {/* Coupon */}
            <div className="mb-4 pb-4 border-b border-line">
              {coupon ? (
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="inline-flex items-center gap-1.5 text-stock">
                    <Check size={14} /> <span className="font-mono">{coupon.code}</span> applied
                  </span>
                  <button type="button" onClick={removeCoupon} className="text-ink-faint hover:text-low inline-flex items-center gap-0.5 text-[12px]">
                    <X size={13} /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code"
                    className="flex-1 min-w-0 border border-line rounded-sm px-2.5 py-1.5 text-[13px] font-mono uppercase bg-card outline-none focus:border-teal transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="border border-line-strong rounded-sm px-3 text-[12.5px] font-medium text-ink hover:border-teal hover:text-teal transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    {applyingCoupon ? "…" : "Apply"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-mono tabular">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-stock">
                  <span>Discount ({coupon?.code})</span>
                  <span className="font-mono tabular">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-soft">Shipping</span>
                <span className="font-mono tabular">
                  {shippingAmount === 0 ? "Free" : formatPrice(shippingAmount)}
                </span>
              </div>
              {isFirstOrder && shippingAmount === 0 && (
                <p className="text-[12px] text-stock">Complimentary shipping — your first order ships free.</p>
              )}
            </div>
            <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-line">
              <span className="text-[14px] font-medium text-ink">Total</span>
              <span className="font-mono tabular text-[22px] text-amber">{formatPrice(total)}</span>
            </div>

            <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-teal shrink-0"
              />
              <span className="text-[12px] text-ink-soft leading-relaxed">
                I confirm these products are for professional use within my licensed scope of practice, and I
                accept the{" "}
                <Link href="/legal/terms" className="text-teal hover:underline" target="_blank">
                  terms of service
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !minimumMet}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors mt-4 disabled:opacity-60"
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
