import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/auth";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_CLASSES, isOrderStatus } from "@/lib/order-status";
import { ResetPasswordButton, ToggleRoleButton } from "@/components/admin/UserRowActions";

export const metadata = { title: "User — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminUser = await getAdminUser();
  const admin = createAdminClient();

  const [{ data: profile }, { data: orders }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).single(),
    admin
      .from("orders")
      .select("id, reference_number, status, total, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (!profile) notFound();

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-3 text-[13.5px]">
      <dt className="w-[120px] shrink-0 text-ink-faint">{label}</dt>
      <dd className="text-ink break-all">{value || "—"}</dd>
    </div>
  );

  return (
    <div className="max-w-[820px]">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-4">
        <Link href="/admin/users" className="hover:text-teal transition-colors">
          Users
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink">{name || profile.email}</span>
      </nav>

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <h1 className="font-serif font-medium text-[26px] tracking-tight">{name || "—"}</h1>
        {profile.role === "admin" && (
          <span className="font-mono text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full bg-teal text-[#F4FBF8]">
            Admin
          </span>
        )}
        <div className="ml-auto flex items-center gap-4">
          <ResetPasswordButton userId={profile.id} />
          <ToggleRoleButton userId={profile.id} currentRole={profile.role} isSelf={profile.id === adminUser?.id} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        <section className="bg-card border border-line rounded-[4px] p-5">
          <h2 className="eyebrow mb-4">Profile</h2>
          <dl className="flex flex-col gap-2">
            {row("Email", profile.email)}
            {row("Phone", profile.phone)}
            {row("Company", profile.company)}
            {row("Business phone", profile.business_phone)}
            {row("Website", profile.website)}
            {row("Joined", profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US") : "—")}
          </dl>
        </section>

        <section className="bg-teal-tint border border-teal/25 rounded-[4px] p-5">
          <h2 className="eyebrow mb-4">License &amp; address</h2>
          <dl className="flex flex-col gap-2">
            {row("Holder", profile.license_holder_name)}
            {row("Profession", profile.profession)}
            {row("License #", <span className="font-mono tabular">{profile.license_number}</span>)}
            {row("Expiry", profile.license_expiry ? String(profile.license_expiry).slice(0, 10) : "—")}
            {row("State", profile.license_state)}
            {row(
              "Address",
              [profile.address_line1, profile.city, profile.state, profile.postal_code].filter(Boolean).join(", ")
            )}
          </dl>
        </section>
      </div>

      <section className="bg-card border border-line rounded-[4px] p-5">
        <h2 className="eyebrow mb-4">Order history ({orders?.length ?? 0})</h2>
        {!orders || orders.length === 0 ? (
          <p className="text-[13.5px] text-ink-faint">No orders placed.</p>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint py-2 pr-3">Reference</th>
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint py-2 pr-3">Date</th>
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint py-2 pr-3">Status</th>
                <th className="text-right font-mono text-[10.5px] tracking-wide uppercase text-ink-faint py-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => {
                const status = isOrderStatus(o.status) ? o.status : "pending";
                return (
                  <tr key={o.id}>
                    <td className="py-2.5 pr-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono tabular text-teal hover:underline">
                        {o.reference_number}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-ink-soft">
                      {new Date(o.created_at).toLocaleDateString("en-US")}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full ${ORDER_STATUS_CLASSES[status]}`}>
                        {ORDER_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono tabular text-ink">
                      {formatPrice(Number(o.total ?? 0))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
