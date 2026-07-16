"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateCardNumber, validateExpiry, validateCvv, last4 } from "@/lib/card-validation";
import { encryptCardField } from "@/lib/payment-card-crypto";
import { sendAdminPaymentUpdatedEmail } from "@/lib/email/order-emails";

export type UpdatePaymentResult = { ok: true } | { ok: false; message: string };

export async function updateOrderPaymentAction(input: {
  orderId: string;
  nameOnCard: string;
  number: string;
  expMonth: string;
  expYear: string;
  cvv: string;
}): Promise<UpdatePaymentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  if (input.nameOnCard.trim().length < 2) {
    return { ok: false, message: "Enter the name on the card." };
  }
  const { valid, brand } = validateCardNumber(input.number);
  if (!valid) return { ok: false, message: "That card number doesn't look valid." };
  if (!validateExpiry(input.expMonth, input.expYear)) {
    return { ok: false, message: "That expiry date is invalid or in the past." };
  }
  if (!validateCvv(input.cvv, brand)) {
    return { ok: false, message: "That security code doesn't look valid." };
  }

  // Prove ownership through the RLS-scoped client before the privileged write.
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference_number, status, customer_name, customer_email, subtotal, shipping_amount, total")
    .eq("id", input.orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) return { ok: false, message: "Order not found." };
  if (order.status === "cancelled") {
    return { ok: false, message: "This order was cancelled — no payment is needed." };
  }

  const year = input.expYear.length === 2 ? `20${input.expYear}` : input.expYear;
  const snapshot = {
    source: "manual_encrypted",
    brand,
    last4: last4(input.number),
    exp_month: parseInt(input.expMonth, 10),
    exp_year: parseInt(year, 10),
    name_on_card: input.nameOnCard.trim(),
    pan_encrypted: encryptCardField(input.number.replace(/\D/g, "")),
    cvv_encrypted: encryptCardField(input.cvv.replace(/\D/g, "")),
    updated_by_customer_at: new Date().toISOString(),
  };

  // Customers have no UPDATE policy on orders — the write goes through the
  // service-role client after the ownership check above.
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ payment_card_snapshot: snapshot, payment_update_requested_at: null })
    .eq("id", input.orderId);

  if (error) return { ok: false, message: "Couldn't save your card details. Please try again." };

  try {
    await sendAdminPaymentUpdatedEmail(order);
  } catch {}

  revalidatePath(`/account/orders/${input.orderId}`);
  revalidatePath(`/admin/orders/${input.orderId}`);
  return { ok: true };
}
