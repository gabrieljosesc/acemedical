"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateOrderPaymentAction } from "@/app/actions/order-payment";
import { FormField } from "@/components/forms/FormField";

export default function UpdatePaymentForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ nameOnCard: "", number: "", expMonth: "", expYear: "", cvv: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await updateOrderPaymentAction({ orderId, ...form });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(`/account/orders/${orderId}?payment_updated=1`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-line rounded-[4px] p-5 flex flex-col gap-3">
      {error && (
        <p className="text-[13px] text-low bg-low-bg border border-low/30 rounded-sm px-3 py-2.5">{error}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <FormField
          label="Name on card"
          required
          value={form.nameOnCard}
          onChange={(e) => setForm((f) => ({ ...f, nameOnCard: e.target.value }))}
          span2
        />
        <FormField
          label="Card number"
          required
          value={form.number}
          onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
          span2
        />
        <FormField
          label="Expiry month (MM)"
          required
          value={form.expMonth}
          onChange={(e) => setForm((f) => ({ ...f, expMonth: e.target.value }))}
        />
        <FormField
          label="Expiry year (YYYY)"
          required
          value={form.expYear}
          onChange={(e) => setForm((f) => ({ ...f, expYear: e.target.value }))}
        />
        <FormField
          label="Security code"
          required
          value={form.cvv}
          onChange={(e) => setForm((f) => ({ ...f, cvv: e.target.value }))}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14px] px-5 py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit new card details"}
      </button>
    </form>
  );
}
