import Link from "next/link";
import { Package, ShoppingBag, Users, Clock, DollarSign } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_CLASSES, isOrderStatus } from "@/lib/order-status";

export const metadata = { title: "Dashboard — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const [
    { count: productCount },
    { count: orderCount },
    { count: pendingCount },
    { count: userCount },
    { data: revenueRows },
    { data: recentOrders },
  ] = await Promise.all([
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("orders").select("total").neq("status", "cancelled"),
    admin
      .from("orders")
      .select("id, reference_number, customer_name, customer_email, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const revenue = (revenueRows ?? []).reduce((sum, r) => sum + Number(r.total ?? 0), 0);

  const stats = [
    { label: "Revenue (non-cancelled)", value: formatPrice(revenue), icon: DollarSign, href: "/admin/orders" },
    { label: "Orders", value: String(orderCount ?? 0), icon: ShoppingBag, href: "/admin/orders" },
    { label: "Pending review", value: String(pendingCount ?? 0), icon: Clock, href: "/admin/orders?status=pending" },
    { label: "Products", value: String(productCount ?? 0), icon: Package, href: "/admin/products" },
    { label: "Customers", value: String(userCount ?? 0), icon: Users, href: "/admin/users" },
  ];

  return (
    <div>
      <h1 className="font-serif font-medium text-[28px] tracking-tight">Dashboard</h1>
      <p className="text-[14px] text-ink-soft mt-1 mb-6">Store overview at a glance.</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-card border border-line rounded-[4px] p-4 hover:border-teal transition-colors group"
          >
            <div className="flex items-center justify-between mb-2.5">
              <Icon size={16} className="text-teal" />
            </div>
            <p className="font-mono tabular text-[22px] text-ink leading-none">{value}</p>
            <p className="text-[12px] text-ink-faint mt-1.5 group-hover:text-ink-soft transition-colors">{label}</p>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="eyebrow">Recent orders</h2>
        <Link href="/admin/orders" className="text-[13px] text-teal hover:underline">
          View all →
        </Link>
      </div>
      <div className="bg-card border border-line rounded-[4px] overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Reference</th>
              <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Customer</th>
              <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Status</th>
              <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Placed</th>
              <th className="text-right font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(recentOrders ?? []).map((o) => {
              const status = isOrderStatus(o.status) ? o.status : "pending";
              return (
                <tr key={o.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono tabular text-teal hover:underline">
                      {o.reference_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{o.customer_name || "—"}</p>
                    <p className="text-[12px] text-ink-faint">{o.customer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full ${ORDER_STATUS_CLASSES[status]}`}>
                      {ORDER_STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {new Date(o.created_at).toLocaleDateString("en-US")}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-ink">
                    {formatPrice(Number(o.total ?? 0))}
                  </td>
                </tr>
              );
            })}
            {(recentOrders ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
