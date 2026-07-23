import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login?next=/checkout");
  }

  const admin = createAdminClient();
  const supabase = await createClient();
  const [{ data: profile }, { data: defaultAddress }, { data: savedCards }, { count: priorOrders }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("first_name, last_name, company, phone, address_line1, city, state, postal_code, country")
        .eq("id", user.id)
        .single(),
      supabase
        .from("user_addresses")
        .select("recipient_name, phone, line1, line2, city, state, postal_code, country")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle(),
      supabase
        .from("user_saved_cards")
        .select("id, brand, last4, exp_month, exp_year, name_on_card, is_default")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "cancelled"),
    ]);
  const firstOrder = (priorOrders ?? 0) === 0;

  const recipientName =
    defaultAddress?.recipient_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  // Prefer the default saved address; fall back to the delivery address
  // captured at registration on the profile.
  return (
    <CheckoutForm
      savedCards={savedCards ?? []}
      isFirstOrder={firstOrder}
      prefill={{
        recipientName,
        company: profile?.company ?? "",
        phone: defaultAddress?.phone || profile?.phone || "",
        line1: defaultAddress?.line1 || profile?.address_line1 || "",
        line2: defaultAddress?.line2 || "",
        city: defaultAddress?.city || profile?.city || "",
        state: defaultAddress?.state || profile?.state || "",
        zip: defaultAddress?.postal_code || profile?.postal_code || "",
        country: defaultAddress?.country || profile?.country || "US",
      }}
    />
  );
}
