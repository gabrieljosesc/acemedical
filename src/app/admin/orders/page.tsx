import Link from "next/link";
import { Search, Package } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_CLASSES,
  isOrderStatus,
} from "@/lib/order-status";

export const metadata = { title: "Orders — Admin" };

type RawSearchParams = Record<string, string | string[] | undefined>;

function one(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const status = one(raw.status);
  const q = one(raw.q);

  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select("id, reference_number, customer_name, customer_email, status, subtotal, total, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (isOrderStatus(status)) query = query.eq("status", status);
  if (q) {
    const term = `%${escapeIlike(q)}%`;
    query = query.or(
      `customer_name.ilike.${term},customer_email.ilike.${term},reference_number.ilike.${term}`
    );
  }

  const { data: orders } = await query;

  function filterUrl(nextStatus?: string) {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  return (
    <div>
      <h1 className="font-serif font-medium text-[28px] tracking-tight">Orders</h1>
      <p className="text-[14px] text-ink-soft mt-1 mb-6">
        {orders?.length ?? 0} shown{(orders?.length ?? 0) === 200 ? " (most recent 200)" : ""}
      </p>

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

        <form action="/admin/orders" method="get" className="flex items-center gap-2 bg-card border border-line rounded-sm px-3 py-2 w-[260px] text-ink-faint focus-within:border-teal transition-colors">
          {isOrderStatus(status) && <input type="hidden" name="status" value={status} />}
          <Search size={14} className="shrink-0" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Name, email, or reference"
            className="border-0 bg-transparent outline-none text-[13px] text-ink w-full placeholder:text-ink-faint"
          />
        </form>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-line rounded-[4px]">
          <Package size={28} className="text-ink-faint mx-auto mb-3" />
          <p className="text-[14.5px] font-medium text-ink">No orders found</p>
        </div>
      ) : (
        <div className="bg-card border border-line rounded-[4px] overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">When</th>
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Reference</th>
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Customer</th>
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Status</th>
                <th className="text-right font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => {
                const s = isOrderStatus(order.status) ? order.status : "pending";
                return (
                  <tr key={order.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono tabular font-medium text-teal hover:underline"
                      >
                        {order.reference_number ?? order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-ink">{order.customer_name ?? "—"}</div>
                      <div className="text-[12px] text-ink-faint">{order.customer_email ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full ${ORDER_STATUS_CLASSES[s]}`}>
                        {ORDER_STATUS_LABELS[s]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular text-amber">
                      {formatPrice(Number(order.total ?? order.subtotal))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
