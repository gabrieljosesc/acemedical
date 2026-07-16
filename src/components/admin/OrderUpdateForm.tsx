"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateOrderAction } from "@/app/actions/admin-orders";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-status";

export default function OrderUpdateForm({
  orderId,
  initialStatus,
  initialAdminNotes,
  initialCustomerVisibleNote,
}: {
  orderId: string;
  initialStatus: string;
  initialAdminNotes: string;
  initialCustomerVisibleNote: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes);
  const [customerVisibleNote, setCustomerVisibleNote] = useState(initialCustomerVisibleNote);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateOrderAction({ id: orderId, status, adminNotes, customerVisibleNote });
      if (result.ok) {
        toast.success(result.message ?? "Order updated");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-line rounded-[4px] p-5 flex flex-col gap-4">
      <h2 className="eyebrow">Update order</h2>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <span className="text-[11.5px] text-ink-faint">
          Changing the status emails the customer (except Pending Review).
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Admin notes (internal)</span>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
          placeholder="Only visible to admins."
          className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors resize-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Message to customer</span>
        <textarea
          value={customerVisibleNote}
          onChange={(e) => setCustomerVisibleNote(e.target.value)}
          rows={3}
          placeholder="Shown on the customer's order page."
          className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors resize-none"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-5 py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
