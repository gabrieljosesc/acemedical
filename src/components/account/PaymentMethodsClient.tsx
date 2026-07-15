"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { addSavedCard, deleteSavedCard, setDefaultSavedCard } from "@/app/actions/saved-cards";
import { FormField } from "@/components/forms/FormField";

type SavedCard = {
  id: string;
  name_on_card: string;
  brand: string | null;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
};

const BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
};

export default function PaymentMethodsClient({ cards }: { cards: SavedCard[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await setDefaultSavedCard(id);
      if (result.ok) {
        toast.success("Default card updated");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Remove this card?")) return;
    startTransition(async () => {
      const result = await deleteSavedCard(id);
      if (result.ok) {
        toast.success("Card removed");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif font-medium text-[28px] tracking-tight">Banks &amp; Cards</h1>
          <p className="text-[14px] text-ink-soft mt-1 max-w-[52ch]">
            Cards on file for your orders. No payment is charged on this website — our team processes
            payment with you directly once an order is approved.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-4 py-2.5 hover:bg-teal-deep transition-colors"
        >
          {showAdd ? <X size={15} /> : <Plus size={15} />}
          {showAdd ? "Cancel" : "Add card"}
        </button>
      </div>

      {showAdd && <AddCardForm onDone={() => setShowAdd(false)} />}

      <div className="flex flex-col gap-3 mt-6">
        {cards.length === 0 && !showAdd && (
          <div className="text-center py-16 border border-dashed border-line rounded-[4px]">
            <CreditCard size={28} className="text-ink-faint mx-auto mb-3" />
            <p className="text-[14.5px] font-medium text-ink">No saved cards yet</p>
            <p className="text-[13px] text-ink-soft mt-1">Add a card to speed up checkout.</p>
          </div>
        )}

        {cards.map((card) => (
          <div key={card.id} className="bg-card border border-line rounded-[4px] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm bg-teal-tint text-teal flex items-center justify-center shrink-0">
              <CreditCard size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-ink font-mono tabular">
                {BRAND_LABELS[card.brand ?? ""] ?? "Card"} ···· {card.last4} ·{" "}
                {String(card.exp_month).padStart(2, "0")}/{String(card.exp_year).slice(-2)}
              </p>
              <p className="text-[12.5px] text-ink-faint truncate">{card.name_on_card}</p>
            </div>
            {card.is_default ? (
              <span className="font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full bg-stock-bg text-stock shrink-0">
                Default
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSetDefault(card.id)}
                disabled={pending}
                className="text-[12.5px] text-teal hover:underline shrink-0 disabled:opacity-60"
              >
                Set default
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(card.id)}
              disabled={pending}
              className="text-[12.5px] text-low hover:underline shrink-0 disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddCardForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ nameOnCard: "", number: "", expMonth: "", expYear: "" });
  const [setDefault, setSetDefault] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addSavedCard({ ...form, setDefault });
      if (result.ok) {
        toast.success("Card saved");
        onDone();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="bg-card border border-line rounded-[4px] p-5 mt-5 flex flex-col gap-3">
      <h2 className="eyebrow">New card</h2>
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
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={setDefault}
          onChange={(e) => setSetDefault(e.target.checked)}
          className="h-4 w-4 accent-teal"
        />
        <span className="text-[13px] text-ink-soft">Set as default card</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-5 py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save card"}
      </button>
    </form>
  );
}
