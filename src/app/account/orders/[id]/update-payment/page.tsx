import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import UpdatePaymentForm from "@/components/account/UpdatePaymentForm";

export const metadata = { title: "Update payment" };

export default async function UpdatePaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return null;

  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference_number, status, payment_card_snapshot")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();

  const card = (order.payment_card_snapshot ?? null) as { brand?: string; last4?: string } | null;

  return (
    <div className="max-w-[480px]">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-4">
        <Link href="/account/orders" className="hover:text-teal transition-colors">
          My Orders
        </Link>
        <ChevronRight size={13} />
        <Link href={`/account/orders/${order.id}`} className="hover:text-teal transition-colors font-mono tabular">
          {order.reference_number}
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink">Update payment</span>
      </nav>

      <h1 className="font-serif font-medium text-[26px] tracking-tight">Update payment details</h1>
      <p className="text-[14px] text-ink-soft mt-1.5 mb-2">
        Submit new card details for order{" "}
        <span className="font-mono tabular text-ink">{order.reference_number}</span>
        {card?.last4 ? ` — replacing the card ending in ${card.last4}.` : "."}
      </p>
      <p className="text-[12.5px] text-ink-soft mb-6 flex items-center gap-1.5">
        <Lock size={12} className="text-teal" />
        Your card is encrypted and never charged online — our team processes payment directly.
      </p>

      {order.status === "cancelled" ? (
        <p className="text-[13.5px] text-low bg-low-bg border border-low/30 rounded-sm px-3.5 py-3">
          This order was cancelled — no payment is needed.
        </p>
      ) : (
        <UpdatePaymentForm orderId={order.id} />
      )}
    </div>
  );
}
