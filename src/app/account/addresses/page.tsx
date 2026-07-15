import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import AddressesClient from "@/components/account/AddressesClient";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return <AddressesClient addresses={addresses ?? []} />;
}
