import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import PrivacyForm from "@/components/account/PrivacyForm";

export const metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("privacy_preferences")
    .eq("id", user.id)
    .single();

  const prefs = (profile?.privacy_preferences ?? {}) as Record<string, boolean>;

  return <PrivacyForm initial={{ analyticsOptIn: prefs.analytics_opt_in ?? true }} />;
}
