"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type AdminUserResult = { ok: true; message?: string } | { ok: false; message: string };

export async function sendUserPasswordReset(userId: string): Promise<AdminUserResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("email").eq("id", userId).single();
  if (!profile?.email) return { ok: false, message: "That user has no email on file." };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `Reset email sent to ${profile.email}` };
}

export async function setUserRole(userId: string, role: "customer" | "admin"): Promise<AdminUserResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };
  if (userId === adminUser.id) return { ok: false, message: "You can't change your own role." };
  if (role !== "customer" && role !== "admin") return { ok: false, message: "Invalid role." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, message: "Couldn't update the role. Please try again." };

  revalidatePath("/admin/users");
  return { ok: true, message: role === "admin" ? "Promoted to admin." : "Set to customer." };
}
