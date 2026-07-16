import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CreditCard } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { decryptCardField } from "@/lib/payment-card-crypto";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_CLASSES,
  isOrderStatus,
  type OrderStatus,
} from "@/lib/order-status";
import OrderUpdateForm from "@/components/admin/OrderUpdateForm";
import OrderItemsEditor from "@/components/admin/OrderItemsEditor";
import RequestPaymentUpdateButton from "@/components/admin/RequestPaymentUpdateButton";

export const metadata = { title: "Order — Admin" };

type CardSnapshot = {
  brand?: string | null;
  last4?: string;
  exp_month?: number | string;
  exp_year?: number | string;
  name_on_card?: string;
  pan_encrypted?: string;
  cvv_encrypted?: string;
  updated_by_customer_at?: string;
};

function formatPan(pan: string): string {
  return pan.replace(/(.{4})/g, "$1 ").trim();
}

function tryDecrypt(payload: string | undefined): string | null {
  if (!payload) return null;
  try {
    return decryptCardField(payload);
  } catch {
    return null;
  }
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const status: OrderStatus = isOrderStatus(order.status) ? order.status : "pending";
  const shipping = (order.shipping_address ?? {}) as Record<string, string>;
  const card = (order.payment_card_snapshot ?? null) as CardSnapshot | null;

  // License details from the customer's profile, when the order has an account.
  let license: Record<string, string | null> | null = null;
  if (order.user_id) {
    const { data } = await admin
      .from("profiles")
      .select("license_holder_name, profession, license_number, license_expiry, license_state, license_country, company, phone")
      .eq("id", order.user_id)
      .single();
    license = data;
  }

  // Full card details decrypted server-side for manual processing —
  // this page is admin-gated at the layout, and the whole point of the
  // card-on-file model is that a human runs the charge out-of-band.
  const pan = tryDecrypt(card?.pan_encrypted);
  const cvv = tryDecrypt(card?.cvv_encrypted);

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-4">
        <Link href="/admin/orders" className="hover:text-teal transition-colors">
          Orders
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink font-mono tabular">{order.reference_number}</span>
      </nav>

      <div className="flex items-center gap-3 flex-wrap mb-7">
        <h1 className="font-serif font-medium text-[26px] tracking-tight font-mono tabular">
          {order.reference_number}
        </h1>
        <span className={`font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full ${ORDER_STATUS_CLASSES[status]}`}>
          {ORDER_STATUS_LABELS[status]}
        </span>
        <span className="text-[13px] text-ink-faint">
          Placed{" "}
          {new Date(order.created_at).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5">
          <section className="bg-card border border-line rounded-[4px] p-5">
            <h2 className="eyebrow mb-3">Customer</h2>
            <div className="text-[13.5px] text-ink-soft leading-relaxed">
              <p className="text-ink font-medium">{order.customer_name ?? "—"}</p>
              <p>{order.customer_email ?? "—"}</p>
              {license?.company && <p>{license.company}</p>}
              {license?.phone && <p className="font-mono tabular text-[12.5px]">{license.phone}</p>}
              {!order.user_id && (
                <span className="inline-block mt-1.5 font-mono text-[10px] tracking-wide px-2 py-0.5 rounded-full bg-low-bg text-low">
                  No account linked
                </span>
              )}
            </div>
          </section>

          {license && (license.license_number || license.license_holder_name) && (
            <section className="bg-card border border-line rounded-[4px] p-5">
              <h2 className="eyebrow mb-3">Medical license</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                <Detail label="Name on license" value={license.license_holder_name} />
                <Detail label="License type" value={license.profession} />
                <Detail label="Number" value={license.license_number} mono />
                <Detail label="Expiry" value={license.license_expiry} mono />
                <Detail label="State issued" value={license.license_state} />
                <Detail label="Country issued" value={license.license_country} />
              </dl>
            </section>
          )}

          <section className="bg-card border border-line rounded-[4px] p-5">
            <h2 className="eyebrow mb-3">Shipping address</h2>
            <div className="text-[13.5px] text-ink-soft leading-relaxed">
              {shipping.recipient_name && <p className="text-ink font-medium">{shipping.recipient_name}</p>}
              {shipping.company && <p>{shipping.company}</p>}
              {shipping.address_line1 && <p>{shipping.address_line1}</p>}
              {shipping.address_line2 && <p>{shipping.address_line2}</p>}
              <p>{[shipping.city, shipping.state, shipping.zip].filter(Boolean).join(", ")}</p>
              {shipping.country && <p>{shipping.country}</p>}
              {shipping.phone && <p className="mt-1 font-mono tabular text-[12.5px]">{shipping.phone}</p>}
            </div>
          </section>

          {order.notes && (
            <section className="bg-card border border-line rounded-[4px] p-5">
              <h2 className="eyebrow mb-2.5">Customer notes</h2>
              <p className="text-[13.5px] text-ink-soft whitespace-pre-wrap">{order.notes}</p>
            </section>
          )}

          <section className="bg-card border border-line rounded-[4px] p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={15} className="text-teal" />
              <h2 className="eyebrow">Payment card (manual processing)</h2>
            </div>

            {card ? (
              <div className="text-[13.5px] leading-relaxed">
                <p className="font-mono tabular text-[16px] text-ink">
                  {pan ? formatPan(pan) : `···· ${card.last4 ?? "????"}`}
                </p>
                <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-[13px] mt-3">
                  <Detail label="Name" value={card.name_on_card} />
                  <Detail
                    label="Expiry"
                    value={
                      card.exp_month
                        ? `${String(card.exp_month).padStart(2, "0")}/${String(card.exp_year).slice(-2)}`
                        : null
                    }
                    mono
                  />
                  <Detail label="CVV" value={cvv ?? "decrypt error"} mono />
                </dl>
                {card.updated_by_customer_at && (
                  <p className="text-[12px] text-stock mt-3">
                    Card updated by the customer on{" "}
                    {new Date(card.updated_by_customer_at).toLocaleString("en-US")}
                  </p>
                )}
                {order.payment_update_requested_at && (
                  <p className="text-[12px] text-low mt-1.5">
                    Payment update requested{" "}
                    {new Date(order.payment_update_requested_at).toLocaleString("en-US")} — waiting on the
                    customer.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[13.5px] text-ink-faint">No card on file for this order.</p>
            )}

            {status !== "cancelled" && (
              <div className="mt-4 pt-4 border-t border-line">
                <RequestPaymentUpdateButton orderId={order.id} />
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <OrderItemsEditor
            orderId={order.id}
            initialItems={(order.items ?? []).map(
              (i: {
                product_id: string | null;
                product_name: string;
                product_image: string | null;
                quantity: number;
                unit_price: number;
              }) => ({
                productId: i.product_id,
                productName: i.product_name,
                productImage: i.product_image,
                quantity: i.quantity,
                unitPrice: Number(i.unit_price),
              })
            )}
            initialShipping={Number(order.shipping_amount ?? 0)}
          />

          <section className="bg-card border border-line rounded-[4px] p-5">
            <h2 className="eyebrow mb-3">Totals on record</h2>
            <div className="flex flex-col gap-2 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-mono tabular">{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Shipping</span>
                <span className="font-mono tabular">
                  {Number(order.shipping_amount ?? 0) === 0
                    ? "Free"
                    : formatPrice(Number(order.shipping_amount))}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-line">
                <span className="font-medium text-ink">Total</span>
                <span className="font-mono tabular text-amber text-[16px]">
                  {formatPrice(Number(order.total ?? order.subtotal))}
                </span>
              </div>
            </div>
          </section>

          <OrderUpdateForm
            orderId={order.id}
            initialStatus={status}
            initialAdminNotes={order.admin_notes ?? ""}
            initialCustomerVisibleNote={order.customer_visible_note ?? ""}
          />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-[9.5px] tracking-wide uppercase text-ink-faint">{label}</dt>
      <dd className={`text-ink mt-0.5 ${mono ? "font-mono tabular" : ""}`}>{value || "—"}</dd>
    </div>
  );
}
