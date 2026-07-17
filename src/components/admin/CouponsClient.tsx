"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Ticket } from "lucide-react";
import { toast } from "sonner";
import { createCoupon, toggleCoupon, deleteCoupon } from "@/app/actions/coupons";
import { formatPrice } from "@/lib/utils";
import { FormField, FormSelect } from "@/components/forms/FormField";

type Coupon = {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

export default function CouponsClient({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleCoupon(id, isActive);
      if (result.ok) {
        toast.success(result.message ?? "Updated");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this coupon?")) return;
    startTransition(async () => {
      const result = await deleteCoupon(id);
      if (result.ok) {
        toast.success(result.message ?? "Deleted");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif font-medium text-[28px] tracking-tight">Coupons</h1>
          <p className="text-[14px] text-ink-soft mt-1">{coupons.length} coupons</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-4 py-2.5 hover:bg-teal-deep transition-colors"
        >
          {showAdd ? <X size={15} /> : <Plus size={15} />}
          {showAdd ? "Cancel" : "New coupon"}
        </button>
      </div>

      {showAdd && <AddCouponForm onDone={() => setShowAdd(false)} />}

      {coupons.length === 0 && !showAdd ? (
        <div className="text-center py-20 border border-dashed border-line rounded-[4px]">
          <Ticket size={28} className="text-ink-faint mx-auto mb-3" />
          <p className="text-[14.5px] font-medium text-ink">No coupons yet</p>
        </div>
      ) : (
        coupons.length > 0 && (
          <div className="bg-card border border-line rounded-[4px] overflow-x-auto mt-6">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Code</th>
                  <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Discount</th>
                  <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Min</th>
                  <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Used</th>
                  <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Expires</th>
                  <th className="text-right font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 font-mono tabular font-medium text-ink">
                      {c.code}
                      {!c.is_active && <span className="ml-2 text-[10px] text-ink-faint">(inactive)</span>}
                    </td>
                    <td className="px-4 py-3 font-mono tabular">
                      {c.kind === "percent" ? `${Number(c.value)}%` : formatPrice(Number(c.value))}
                    </td>
                    <td className="px-4 py-3 font-mono tabular text-ink-soft">
                      {Number(c.min_subtotal) > 0 ? formatPrice(Number(c.min_subtotal)) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono tabular text-ink-soft">
                      {c.used_count}
                      {c.max_uses !== null ? ` / ${c.max_uses}` : ""}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-US") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggle(c.id, !c.is_active)}
                        disabled={pending}
                        className="text-[12.5px] text-teal hover:underline disabled:opacity-60"
                      >
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={pending}
                        className="text-[12.5px] text-low hover:underline ml-4 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function AddCouponForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "",
    kind: "percent" as "percent" | "fixed",
    value: "",
    minSubtotal: "",
    maxUses: "",
    expiresAt: "",
  });
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCoupon({
        code: form.code,
        kind: form.kind,
        value: Number(form.value),
        minSubtotal: Number(form.minSubtotal) || 0,
        maxUses: form.maxUses.trim() === "" ? null : Number(form.maxUses),
        expiresAt: form.expiresAt || null,
      });
      if (result.ok) {
        toast.success(result.message ?? "Created");
        onDone();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="bg-card border border-line rounded-[4px] p-5 mt-6 flex flex-col gap-3">
      <h2 className="eyebrow">New coupon</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <FormField label="Code" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SPRING10" />
        <FormSelect label="Type" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as "percent" | "fixed" }))}>
          <option value="percent">Percent off</option>
          <option value="fixed">Fixed amount off</option>
        </FormSelect>
        <FormField label={form.kind === "percent" ? "Percent (e.g. 10)" : "Amount (USD)"} required type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
        <FormField label="Minimum subtotal (USD)" type="number" value={form.minSubtotal} onChange={(e) => setForm((f) => ({ ...f, minSubtotal: e.target.value }))} placeholder="0" />
        <FormField label="Max uses (blank = unlimited)" type="number" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} />
        <FormField label="Expires (blank = never)" type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-5 py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create coupon"}
      </button>
    </form>
  );
}
