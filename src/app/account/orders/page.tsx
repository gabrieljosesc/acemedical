import Link from "next/link";
import { Package, Search, ChevronRight } from "lucide-react";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_CLASSES,
  isOrderStatus,
} from "@/lib/order-status";

export const metadata = { title: "My Orders" };

type RawSearchParams = Record<string, string | string[] | undefined>;

function one(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await getAuthUser();
  if (!user) return null;

  const raw = await searchParams;
  const status = one(raw.status);
  const q = one(raw.q);

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, reference_number, status, subtotal, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (isOrderStatus(status)) query = query.eq("status", status);
  if (q) query = query.ilike("reference_number", `%${q}%`);

  const { data: orders } = await query;

  function filterUrl(nextStatus?: string) {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/account/orders?${qs}` : "/account/orders";
  }

  return (
    <div>
      <h1 className="font-serif font-medium text-[28px] tracking-tight">My Orders</h1>
      <p className="text-[14px] text-ink-soft mt-1 mb-6">Track and review your orders.</p>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-1 flex-wrap">
          <Link
            href={filterUrl()}
            className={`text-[12.5px] px-3 py-1.5 rounded-sm transition-colors ${
              !isOrderStatus(status) ? "bg-teal text-[#F4FBF8] font-medium" : "text-ink-soft hover:bg-surface"
            }`}
          >
            All
          </Link>
          {ORDER_STATUSES.map((s) => (
            <Link
              key={s}
              href={filterUrl(s)}
              className={`text-[12.5px] px-3 py-1.5 rounded-sm transition-colors ${
                status === s ? "bg-teal text-[#F4FBF8] font-medium" : "text-ink-soft hover:bg-surface"
              }`}
            >
              {ORDER_STATUS_LABELS[s]}
            </Link>
          ))}
        </div>

        <form action="/account/orders" method="get" className="flex items-center gap-2 bg-card border border-line rounded-sm px-3 py-2 w-[200px] text-ink-faint focus-within:border-teal transition-colors">
          {isOrderStatus(status) && <input type="hidden" name="status" value={status} />}
          <Search size={14} className="shrink-0" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Reference #"
            className="border-0 bg-transparent outline-none text-[13px] text-ink w-full placeholder:text-ink-faint"
          />
        </form>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-line rounded-[4px]">
          <Package size={28} className="text-ink-faint mx-auto mb-3" />
          <p className="text-[14.5px] font-medium text-ink">No orders found</p>
          <p className="text-[13px] text-ink-soft mt-1">
            {status || q ? "Try clearing the filters." : "Your orders will appear here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {orders.map((order) => {
            const s = isOrderStatus(order.status) ? order.status : "pending";
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="bg-card border border-line rounded-[4px] p-4 flex items-center gap-4 hover:border-line-strong transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono tabular text-[14px] font-medium text-ink">
                    {order.reference_number}
                  </p>
                  <p className="text-[12.5px] text-ink-faint mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className={`font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full shrink-0 ${ORDER_STATUS_CLASSES[s]}`}>
                  {ORDER_STATUS_LABELS[s]}
                </span>
                <span className="font-mono tabular text-[15px] text-amber shrink-0">
                  {formatPrice(Number(order.total ?? order.subtotal))}
                </span>
                <ChevronRight size={16} className="text-ink-faint shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
