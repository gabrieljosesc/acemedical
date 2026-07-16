import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the signed-in user only if their profile role is 'admin',
 * otherwise null. Checked via the service-role client so it can't be
 * spoofed by RLS quirks on the profiles table.
 */
export async function getAdminUser() {
  const user = await getAuthUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();

  return profile?.role === "admin" ? user : null;
}
