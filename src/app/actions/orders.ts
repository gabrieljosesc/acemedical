"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateCardNumber, validateExpiry, validateCvv, last4 } from "@/lib/card-validation";
import { encryptCardField } from "@/lib/payment-card-crypto";
import { calculateShipping } from "@/lib/shipping";
import { parsePriceTiers, unitPriceForQuantity } from "@/lib/price-tiers";
import { sendOrderReceivedEmail, sendAdminNewOrderEmail } from "@/lib/email/order-emails";

const REFERENCE_FLOOR = 100000;

type PlaceOrderInput = {
  items: { productId: string; quantity: number }[];
  shipping: {
    recipientName: string;
    company: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  card: {
    number: string;
    expMonth: string;
    expYear: string;
    cvv: string;
    nameOnCard: string;
  };
  notes?: string;
};

type PlaceOrderResult = { ok: true; referenceNumber: string } | { ok: false; message: string };

async function nextReferenceNumber(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data } = await supabase
    .from("orders")
    .select("reference_number")
    .order("created_at", { ascending: false })
    .limit(500);

  let max = REFERENCE_FLOOR;
  for (const row of data ?? []) {
    const match = row.reference_number.match(/(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `AMW-${max + 1}`;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please sign in to place an order." };
  }

  if (input.items.length === 0) {
    return { ok: false, message: "Your cart is empty." };
  }

  if (!input.shipping.line1 || !input.shipping.city || !input.shipping.zip) {
    return { ok: false, message: "Please complete the shipping address." };
  }

  const { valid: cardValid, brand } = validateCardNumber(input.card.number);
  if (!cardValid) {
    return { ok: false, message: "That card number doesn't look valid." };
  }
  if (!validateExpiry(input.card.expMonth, input.card.expYear)) {
    return { ok: false, message: "That card's expiry date is invalid or in the past." };
  }
  if (!validateCvv(input.card.cvv, brand)) {
    return { ok: false, message: "That security code doesn't look valid." };
  }

  // Re-fetch products server-side — never trust client-submitted prices.
  const admin = createAdminClient();
  const productIds = input.items.map((i) => i.productId);
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, price, price_tiers, images")
    .in("id", productIds);

  if (productsError || !products || products.length === 0) {
    return { ok: false, message: "Something went wrong loading your cart items. Please try again." };
  }

  const productById = new Map(products.map((p) => [p.id, p]));
  const orderItems = input.items
    .map((item) => {
      const product = productById.get(item.productId);
      if (!product) return null;
      // Volume pricing: unit price comes from the matching quantity tier,
      // recomputed server-side — never trust client-submitted prices.
      const unitPrice = unitPriceForQuantity(
        parsePriceTiers(product.price_tiers),
        item.quantity,
        Number(product.price)
      );
      return {
        product_id: product.id,
        product_name: product.name,
        product_image: (product.images ?? [])[0] ?? null,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * item.quantity,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  if (orderItems.length === 0) {
    return { ok: false, message: "None of the items in your cart could be found. Please try again." };
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.total_price, 0);
  const shippingAmount = calculateShipping(subtotal);
  const total = subtotal + shippingAmount;

  const paymentCardSnapshot = {
    brand,
    last4: last4(input.card.number),
    exp_month: input.card.expMonth,
    exp_year: input.card.expYear,
    name_on_card: input.card.nameOnCard,
    pan_encrypted: encryptCardField(input.card.number.replace(/\D/g, "")),
    cvv_encrypted: encryptCardField(input.card.cvv),
  };

  const shippingAddressJson = {
    recipient_name: input.shipping.recipientName,
    company: input.shipping.company,
    address_line1: input.shipping.line1,
    address_line2: input.shipping.line2,
    city: input.shipping.city,
    state: input.shipping.state,
    zip: input.shipping.zip,
    country: input.shipping.country,
    phone: input.shipping.phone,
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    const referenceNumber = await nextReferenceNumber(supabase);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        reference_number: referenceNumber,
        status: "pending",
        subtotal,
        shipping_amount: shippingAmount,
        total,
        shipping_address: shippingAddressJson,
        customer_name: input.shipping.recipientName,
        customer_email: user.email,
        notes: input.notes || null,
        payment_card_snapshot: paymentCardSnapshot,
      })
      .select("id")
      .single();

    if (orderError) {
      if (orderError.code === "23505") continue; // reference_number collision, retry
      console.error("placeOrder insert error:", orderError);
      return { ok: false, message: "We couldn't place your order. Please try again." };
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

    if (itemsError) {
      console.error("placeOrder items insert error:", itemsError);
      return { ok: false, message: "We couldn't save your order items. Please contact support." };
    }

    // Awaited (not fire-and-forget): serverless functions can freeze after
    // the response is sent, so the emails must complete before returning.
    // Both sends never throw — a mail failure can't break order placement.
    const orderSummary = {
      id: order.id,
      reference_number: referenceNumber,
      customer_name: input.shipping.recipientName,
      customer_email: user.email ?? null,
      subtotal,
      shipping_amount: shippingAmount,
      total,
    };
    await Promise.allSettled([
      sendOrderReceivedEmail(orderSummary, orderItems),
      sendAdminNewOrderEmail(orderSummary, orderItems),
    ]);

    return { ok: true, referenceNumber };
  }

  return { ok: false, message: "We couldn't place your order right now. Please try again." };
}
