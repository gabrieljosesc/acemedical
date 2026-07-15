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
  const [{ data: profile }, { data: defaultAddress }] = await Promise.all([
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
  ]);

  const recipientName =
    defaultAddress?.recipient_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  // Prefer the default saved address; fall back to the delivery address
  // captured at registration on the profile.
  return (
    <CheckoutForm
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
