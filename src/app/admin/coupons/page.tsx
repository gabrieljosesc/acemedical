import { createAdminClient } from "@/lib/supabase/server";
import CouponsClient from "@/components/admin/CouponsClient";

export const metadata = { title: "Coupons — Admin" };

export default async function AdminCouponsPage() {
  const admin = createAdminClient();
  const { data: coupons } = await admin
    .from("coupons")
    .select("id, code, kind, value, min_subtotal, max_uses, used_count, expires_at, is_active")
    .order("created_at", { ascending: false });

  return <CouponsClient coupons={coupons ?? []} />;
}
