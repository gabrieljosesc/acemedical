import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import PaymentMethodsClient from "@/components/account/PaymentMethodsClient";

export const metadata = { title: "Banks & Cards" };

export default async function PaymentMethodsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  // Deliberately never select pan_encrypted here — display needs safe columns only.
  const { data: cards } = await supabase
    .from("user_saved_cards")
    .select("id, name_on_card, brand, last4, exp_month, exp_year, is_default, created_at")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return <PaymentMethodsClient cards={cards ?? []} />;
}
