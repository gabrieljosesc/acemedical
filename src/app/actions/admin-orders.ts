"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { isOrderStatus } from "@/lib/order-status";
import { sendOrderStatusEmail, sendPaymentUpdateRequestEmail } from "@/lib/email/order-emails";

export type AdminOrderResult = { ok: true; message?: string } | { ok: false; message: string };

export async function updateOrderAction(input: {
  id: string;
  status: string;
  adminNotes: string;
  customerVisibleNote: string;
}): Promise<AdminOrderResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  if (!isOrderStatus(input.status)) {
    return { ok: false, message: "Invalid order status." };
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, reference_number, status, customer_name, customer_email, subtotal, shipping_amount, total")
    .eq("id", input.id)
    .single();

  if (!order) return { ok: false, message: "Order not found." };

  const { error } = await admin
    .from("orders")
    .update({
      status: input.status,
      admin_notes: input.adminNotes || null,
      customer_visible_note: input.customerVisibleNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) return { ok: false, message: "Couldn't save the order. Please try again." };

  // Email the customer only when the status actually changed.
  if (order.status !== input.status) {
    try {
      await sendOrderStatusEmail(order, input.status);
    } catch {}
  }

  revalidatePath(`/admin/orders/${input.id}`);
  revalidatePath(`/account/orders/${input.id}`);
  return { ok: true, message: "Order updated." };
}

export type EditableOrderItem = {
  productId: string | null;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
};

export async function saveOrderItemsAction(input: {
  orderId: string;
  items: EditableOrderItem[];
  shippingAmount: number;
}): Promise<AdminOrderResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const items = input.items
    .map((i) => ({
      product_id: i.productId,
      product_name: i.productName.trim(),
      product_image: i.productImage,
      quantity: Math.max(1, Math.round(i.quantity)),
      unit_price: Math.max(0, Number(i.unitPrice)),
    }))
    .filter((i) => i.product_name.length > 0);

  if (items.length === 0) {
    return { ok: false, message: "An order needs at least one item." };
  }

  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const shippingAmount = Math.max(0, Number(input.shippingAmount) || 0);
  const total = subtotal + shippingAmount;

  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("order_items").delete().eq("order_id", input.orderId);
  if (deleteError) return { ok: false, message: "Couldn't update the items. Please try again." };

  const { error: insertError } = await admin.from("order_items").insert(
    items.map((i) => ({
      ...i,
      order_id: input.orderId,
      total_price: i.unit_price * i.quantity,
    }))
  );
  if (insertError) return { ok: false, message: "Couldn't save the items. Please contact support." };

  const { error: orderError } = await admin
    .from("orders")
    .update({ subtotal, shipping_amount: shippingAmount, total, updated_at: new Date().toISOString() })
    .eq("id", input.orderId);
  if (orderError) return { ok: false, message: "Items saved, but totals failed to update." };

  revalidatePath(`/admin/orders/${input.orderId}`);
  revalidatePath(`/account/orders/${input.orderId}`);
  return { ok: true, message: "Items and totals updated." };
}

export async function requestPaymentUpdateAction(orderId: string): Promise<AdminOrderResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, reference_number, status, customer_name, customer_email, subtotal, shipping_amount, total")
    .eq("id", orderId)
    .single();

  if (!order) return { ok: false, message: "Order not found." };
  if (order.status === "cancelled") {
    return { ok: false, message: "This order is cancelled — no payment update needed." };
  }

  const { error } = await admin
    .from("orders")
    .update({ payment_update_requested_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    return { ok: false, message: "Couldn't flag the order — has supabase/admin-orders.sql been run?" };
  }

  const emailResult = await sendPaymentUpdateRequestEmail(order);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);

  if (!emailResult.ok) {
    return {
      ok: true,
      message:
        "Flag set — the customer will see it on their order page, but the email didn't send (no email transport configured?).",
    };
  }
  return { ok: true, message: "Payment update requested — the customer has been emailed." };
}
