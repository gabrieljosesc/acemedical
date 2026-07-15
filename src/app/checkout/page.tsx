import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login?next=/checkout");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, company, phone")
    .eq("id", user.id)
    .single();

  const recipientName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  return (
    <CheckoutForm
      prefill={{
        recipientName,
        company: profile?.company ?? "",
        phone: profile?.phone ?? "",
      }}
    />
  );
}
