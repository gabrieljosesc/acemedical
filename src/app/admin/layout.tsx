import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/auth";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    redirect("/");
  }

  return (
    <div>
      <div className="bg-ink text-[#F4FBF8]">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-10 flex items-center gap-6 py-3">
          <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#8FD3C5]">Admin</span>
          <nav className="flex items-center gap-5">
            <Link href="/admin/orders" className="text-[13.5px] hover:text-[#8FD3C5] transition-colors">
              Orders
            </Link>
            <Link href="/admin/products" className="text-[13.5px] hover:text-[#8FD3C5] transition-colors">
              Products
            </Link>
            <Link href="/admin/coupons" className="text-[13.5px] hover:text-[#8FD3C5] transition-colors">
              Coupons
            </Link>
          </nav>
          <Link
            href="/"
            className="ml-auto text-[13px] text-[#A9D4CB] hover:text-[#F4FBF8] transition-colors"
          >
            ← Storefront
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-10">{children}</div>
    </div>
  );
}
