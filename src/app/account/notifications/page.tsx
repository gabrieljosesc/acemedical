import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import NotificationsForm from "@/components/account/NotificationsForm";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .single();

  const prefs = (profile?.notification_preferences ?? {}) as Record<string, boolean>;

  return (
    <NotificationsForm
      initial={{
        emailOrderUpdates: prefs.email_order_updates ?? true,
        emailProductNews: prefs.email_product_news ?? false,
      }}
    />
  );
}
