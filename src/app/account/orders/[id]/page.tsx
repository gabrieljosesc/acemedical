import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight, Package } from "lucide-react";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_CLASSES,
  isOrderStatus,
  type OrderStatus,
} from "@/lib/order-status";

export const metadata = { title: "Order details" };

type OrderItem = {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: { slug: string } | { slug: string }[] | null;
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return null;

  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*, product:products(slug))")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();

  const status: OrderStatus = isOrderStatus(order.status) ? order.status : "pending";
  const shipping = (order.shipping_address ?? {}) as Record<string, string>;
  const items = (order.items ?? []) as OrderItem[];

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-4">
        <Link href="/account/orders" className="hover:text-teal transition-colors">
          My Orders
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink font-mono tabular">{order.reference_number}</span>
      </nav>

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <h1 className="font-serif font-medium text-[26px] tracking-tight font-mono tabular">
          {order.reference_number}
        </h1>
        <span className={`font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full ${ORDER_STATUS_CLASSES[status]}`}>
          {ORDER_STATUS_LABELS[status]}
        </span>
        <span className="text-[13px] text-ink-faint">
          Placed{" "}
          {new Date(order.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <section className="bg-card border border-line rounded-[4px] p-5">
            <h2 className="eyebrow mb-4">Items</h2>
            <div className="flex flex-col divide-y divide-line">
              {items.map((item) => {
                const productSlug = Array.isArray(item.product) ? item.product[0]?.slug : item.product?.slug;
                return (
                  <div key={item.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                    <div className="w-14 h-14 rounded-sm border border-line bg-card relative overflow-hidden flex items-center justify-center shrink-0">
                      {item.product_image ? (
                        <Image src={item.product_image} alt="" fill className="object-contain p-1" sizes="56px" />
                      ) : (
                        <Package size={18} className="text-ink-faint" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {productSlug ? (
                        <Link
                          href={`/product/${productSlug}`}
                          className="text-[14px] font-medium text-ink hover:text-teal transition-colors"
                        >
                          {item.product_name}
                        </Link>
                      ) : (
                        <p className="text-[14px] font-medium text-ink">{item.product_name}</p>
                      )}
                      <p className="font-mono tabular text-[12px] text-ink-soft mt-0.5">
                        {item.quantity} × {formatPrice(Number(item.unit_price))}
                      </p>
                    </div>
                    <span className="font-mono tabular text-[14px] text-ink shrink-0">
                      {formatPrice(Number(item.total_price))}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {order.notes && (
            <section className="bg-card border border-line rounded-[4px] p-5">
              <h2 className="eyebrow mb-2.5">Your notes</h2>
              <p className="text-[13.5px] text-ink-soft whitespace-pre-wrap">{order.notes}</p>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <section className="bg-card border border-line rounded-[4px] p-5">
            <h2 className="eyebrow mb-4">Summary</h2>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
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
            </div>
            <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-line">
              <span className="text-[14px] font-medium text-ink">Total</span>
              <span className="font-mono tabular text-[20px] text-amber">
                {formatPrice(Number(order.total ?? order.subtotal))}
              </span>
            </div>
          </section>

          <section className="bg-card border border-line rounded-[4px] p-5">
            <h2 className="eyebrow mb-3">Shipping address</h2>
            <div className="text-[13.5px] text-ink-soft leading-relaxed">
              {shipping.recipient_name && <p className="text-ink font-medium">{shipping.recipient_name}</p>}
              {shipping.company && <p>{shipping.company}</p>}
              {shipping.address_line1 && <p>{shipping.address_line1}</p>}
              {shipping.address_line2 && <p>{shipping.address_line2}</p>}
              <p>
                {[shipping.city, shipping.state, shipping.zip].filter(Boolean).join(", ")}
              </p>
              {shipping.country && <p>{shipping.country}</p>}
              {shipping.phone && <p className="mt-1 font-mono tabular text-[12.5px]">{shipping.phone}</p>}
            </div>
          </section>

          <p className="text-[12px] text-ink-faint leading-relaxed px-1">
            No card is charged online — our team processes payment on your card on file once the order is
            approved, then dispatches cold-chain.
          </p>
        </div>
      </div>
    </div>
  );
}
