"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { requestPaymentUpdateAction } from "@/app/actions/admin-orders";

export default function RequestPaymentUpdateButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Ask the customer to submit new card details for this order?")) return;
    startTransition(async () => {
      const result = await requestPaymentUpdateAction(orderId);
      if (result.ok) {
        toast.success(result.message ?? "Payment update requested");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-sm border border-low text-low font-medium text-[13px] px-4 py-2 hover:bg-low-bg transition-colors disabled:opacity-60"
    >
      <Mail size={14} />
      {pending ? "Requesting…" : "Request payment update"}
    </button>
  );
}
