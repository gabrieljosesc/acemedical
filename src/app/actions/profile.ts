"use server";

import { createClient } from "@/lib/supabase/server";

export type ProfileUpdateInput = {
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  company: string;
  businessPhone: string;
  specialty: string;
  website: string;
  licenseHolderName: string;
  profession: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseState: string;
  licenseCountry: string;
};

export async function updateProfile(
  input: ProfileUpdateInput
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please sign in to update your profile." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      prefix: input.prefix || null,
      first_name: input.firstName,
      middle_name: input.middleName || null,
      last_name: input.lastName,
      phone: input.phone,
      address_line1: input.addressLine1,
      city: input.city,
      state: input.state,
      postal_code: input.postalCode,
      country: input.country,
      company: input.company,
      business_phone: input.businessPhone,
      specialty: input.specialty || null,
      website: input.website || null,
      license_holder_name: input.licenseHolderName,
      profession: input.profession,
      license_number: input.licenseNumber,
      license_expiry: input.licenseExpiry || null,
      license_state: input.licenseState,
      license_country: input.licenseCountry,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "We couldn't save your changes. Please try again." };
  }

  return { ok: true };
}
