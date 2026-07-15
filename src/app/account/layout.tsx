import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import AccountSidebar from "@/components/account/AccountSidebar";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login?next=/account/profile");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    user.email?.split("@")[0] ||
    "Account";

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-10">
      <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
        <AccountSidebar
          displayName={displayName}
          email={profile?.email ?? user.email ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
        />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
