"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateCardNumber, validateExpiry, validateCvv, last4 } from "@/lib/card-validation";
import { encryptCardField } from "@/lib/payment-card-crypto";
import { calculateShipping } from "@/lib/shipping";
import { meetsCheckoutMinimumUsd, MIN_CHECKOUT_SUBTOTAL_USD } from "@/lib/cart-minimum";
import { parsePriceTiers, unitPriceForQuantity } from "@/lib/price-tiers";
import { couponDiscount } from "@/lib/coupon-discount";
import { sendOrderReceivedEmail, sendAdminNewOrderEmail } from "@/lib/email/order-emails";

const REFERENCE_FLOOR = 100000;

type Address = {
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

type PlaceOrderInput = {
  items: { productId: string; quantity: number }[];
  shipping: Address;
  // null/undefined = billing same as shipping
  billing?: Address | null;
  couponCode?: string;
  policyAccepted: boolean;
  // Either a card on file (savedCardId + cvv) or full new-card details.
  savedCardId?: string | null;
  savedCardCvv?: string;
  card?: {
    number: string;
    expMonth: string;
    expYear: string;
    cvv: string;
    nameOnCard: string;
  } | null;
  saveNewCard?: boolean;
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

  if (input.billing && (!input.billing.line1 || !input.billing.city || !input.billing.zip)) {
    return { ok: false, message: "Please complete the billing address." };
  }

  if (!input.policyAccepted) {
    return { ok: false, message: "Please confirm the professional-use acknowledgement." };
  }

  // Payment: either a card on file or full new-card details.
  type CardSnapshot = {
    brand: string;
    last4: string;
    exp_month: string | number;
    exp_year: string | number;
    name_on_card: string;
    pan_encrypted: string;
    cvv_encrypted: string;
  };
  let paymentCardSnapshot: CardSnapshot;
  let saveCardAfterOrder: { number: string; expMonth: string; expYear: string; nameOnCard: string; brand: string } | null =
    null;

  if (input.savedCardId) {
    const { data: saved } = await supabase
      .from("user_saved_cards")
      .select("id, brand, last4, exp_month, exp_year, name_on_card, pan_encrypted")
      .eq("id", input.savedCardId)
      .eq("user_id", user.id)
      .single();
    if (!saved) {
      return { ok: false, message: "That saved card couldn't be found — pick another or enter a new card." };
    }
    if (!validateExpiry(String(saved.exp_month), String(saved.exp_year))) {
      return { ok: false, message: "That saved card is expired — update it or use a new card." };
    }
    const cvv = (input.savedCardCvv ?? "").trim();
    if (!validateCvv(cvv, saved.brand as Parameters<typeof validateCvv>[1])) {
      return { ok: false, message: "Enter the security code for your saved card." };
    }
    paymentCardSnapshot = {
      brand: saved.brand,
      last4: saved.last4,
      exp_month: saved.exp_month,
      exp_year: saved.exp_year,
      name_on_card: saved.name_on_card,
      pan_encrypted: saved.pan_encrypted,
      cvv_encrypted: encryptCardField(cvv),
    };
  } else {
    if (!input.card) {
      return { ok: false, message: "Enter your card details or pick a saved card." };
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
    paymentCardSnapshot = {
      brand,
      last4: last4(input.card.number),
      exp_month: input.card.expMonth,
      exp_year: input.card.expYear,
      name_on_card: input.card.nameOnCard,
      pan_encrypted: encryptCardField(input.card.number.replace(/\D/g, "")),
      cvv_encrypted: encryptCardField(input.card.cvv),
    };
    if (input.saveNewCard) {
      saveCardAfterOrder = {
        number: input.card.number,
        expMonth: input.card.expMonth,
        expYear: input.card.expYear,
        nameOnCard: input.card.nameOnCard,
        brand,
      };
    }
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
  if (!meetsCheckoutMinimumUsd(subtotal)) {
    return {
      ok: false,
      message: `Orders have a \$${MIN_CHECKOUT_SUBTOTAL_USD} minimum — your subtotal is below that.`,
    };
  }
  // Coupon is revalidated server-side against the recomputed subtotal —
  // the client's applied discount is never trusted.
  let couponCode: string | null = null;
  let discountAmount = 0;
  if (input.couponCode?.trim()) {
    const code = input.couponCode.trim().toUpperCase();
    const { data: coupon } = await admin
      .from("coupons")
      .select("code, kind, value, min_subtotal, max_uses, used_count, expires_at, is_active")
      .ilike("code", code)
      .maybeSingle();
    const valid =
      coupon &&
      coupon.is_active &&
      (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) &&
      (coupon.max_uses === null || coupon.used_count < coupon.max_uses) &&
      subtotal >= Number(coupon.min_subtotal);
    if (!valid) {
      return { ok: false, message: "That coupon is no longer valid — remove it and try again." };
    }
    couponCode = coupon.code.toUpperCase();
    discountAmount = couponDiscount(coupon.kind, Number(coupon.value), subtotal);
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingAmount = calculateShipping(discountedSubtotal);
  const total = discountedSubtotal + shippingAmount;

  const toAddressJson = (a: Address) => ({
    recipient_name: a.recipientName,
    company: a.company,
    address_line1: a.line1,
    address_line2: a.line2,
    city: a.city,
    state: a.state,
    zip: a.zip,
    country: a.country,
    phone: a.phone,
  });
  const shippingAddressJson = toAddressJson(input.shipping);
  const billingAddressJson = input.billing ? toAddressJson(input.billing) : null;

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
        billing_address: billingAddressJson,
        coupon_code: couponCode,
        discount_amount: discountAmount,
        policy_acknowledged_at: new Date().toISOString(),
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

    if (saveCardAfterOrder) {
      // Convenience only — a failure here must not affect the placed order.
      const { count } = await supabase
        .from("user_saved_cards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      await supabase.from("user_saved_cards").insert({
        user_id: user.id,
        name_on_card: saveCardAfterOrder.nameOnCard.trim(),
        brand: saveCardAfterOrder.brand,
        last4: last4(saveCardAfterOrder.number),
        exp_month: parseInt(saveCardAfterOrder.expMonth, 10),
        exp_year: parseInt(
          saveCardAfterOrder.expYear.length === 2 ? `20${saveCardAfterOrder.expYear}` : saveCardAfterOrder.expYear,
          10
        ),
        pan_encrypted: encryptCardField(saveCardAfterOrder.number.replace(/\D/g, "")),
        is_default: (count ?? 0) === 0,
      });
    }

    if (couponCode) {
      // Atomic usage bump; failure here shouldn't block the order.
      admin.rpc("increment_coupon_use", { p_code: couponCode }).then(
        () => {},
        () => {}
      );
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
      discount_amount: discountAmount,
      coupon_code: couponCode,
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
