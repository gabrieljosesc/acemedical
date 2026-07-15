import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/account/ProfileForm";
import AvatarUpload from "@/components/account/AvatarUpload";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  // Layout already gates auth; this is belt-and-suspenders.
  const user = await getAuthUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    user.email?.split("@")[0] ||
    "Account";

  return (
    <div>
      <h1 className="font-serif font-medium text-[28px] tracking-tight">Profile</h1>
      <p className="text-[14px] text-ink-soft mt-1 mb-7">Manage your contact and professional details.</p>

      <div className="grid md:grid-cols-[1fr_240px] gap-6 items-start">
        <div className="bg-card border border-line rounded-[4px] p-5 sm:p-6">
          <ProfileForm
            email={user.email ?? ""}
            profile={{
              prefix: profile?.prefix ?? "",
              firstName: profile?.first_name ?? "",
              middleName: profile?.middle_name ?? "",
              lastName: profile?.last_name ?? "",
              phone: profile?.phone ?? "",
              addressLine1: profile?.address_line1 ?? "",
              city: profile?.city ?? "",
              state: profile?.state ?? "",
              postalCode: profile?.postal_code ?? "",
              country: profile?.country ?? "",
              company: profile?.company ?? "",
              businessPhone: profile?.business_phone ?? "",
              specialty: profile?.specialty ?? "",
              website: profile?.website ?? "",
              licenseHolderName: profile?.license_holder_name ?? "",
              profession: profile?.profession ?? "",
              licenseNumber: profile?.license_number ?? "",
              licenseExpiry: profile?.license_expiry ?? "",
              licenseState: profile?.license_state ?? "",
              licenseCountry: profile?.license_country ?? "",
            }}
          />
        </div>

        <AvatarUpload avatarUrl={profile?.avatar_url ?? null} displayName={displayName} />
      </div>
    </div>
  );
}
