import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/account/ProfileForm";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login?next=/account");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();

  return (
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
  );
}
