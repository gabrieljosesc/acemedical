"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { updateProfile, type ProfileUpdateInput } from "@/app/actions/profile";
import { FormField, FormSelect, FormSection } from "@/components/forms/FormField";

export default function ProfileForm({
  email,
  profile,
}: {
  email: string;
  profile: ProfileUpdateInput;
}) {
  const [form, setForm] = useState<ProfileUpdateInput>(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProfileUpdateInput>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const result = await updateProfile(form);

    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <p className="text-[13.5px] text-low bg-low-bg border border-low/30 rounded-sm px-3.5 py-3">{error}</p>
        )}

        <FormSection title="Account">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink">Email</span>
            <input
              type="email"
              value={email}
              disabled
              className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-surface text-ink-faint outline-none"
            />
          </label>
        </FormSection>

        <FormSection title="Contact information">
          <div className="grid sm:grid-cols-3 gap-3">
            <FormSelect label="Prefix" value={form.prefix} onChange={update("prefix")}>
              <option value="">Select</option>
              <option>Mr.</option>
              <option>Mrs.</option>
              <option>Ms.</option>
              <option>Dr.</option>
              <option>Prof.</option>
            </FormSelect>
            <FormField label="First name" required value={form.firstName} onChange={update("firstName")} />
            <FormField label="Middle name" value={form.middleName} onChange={update("middleName")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Last name" required value={form.lastName} onChange={update("lastName")} />
            <FormField label="Phone" type="tel" required value={form.phone} onChange={update("phone")} />
          </div>
        </FormSection>

        <FormSection title="Delivery address">
          <FormField label="Street address" required value={form.addressLine1} onChange={update("addressLine1")} span2 />
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="City" required value={form.city} onChange={update("city")} />
            <FormField label="State / province" required value={form.state} onChange={update("state")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="ZIP / postal code" required value={form.postalCode} onChange={update("postalCode")} />
            <FormField label="Country" required value={form.country} onChange={update("country")} />
          </div>
        </FormSection>

        <FormSection title="Business information">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Company / clinic name" required value={form.company} onChange={update("company")} />
            <FormField label="Business phone" type="tel" required value={form.businessPhone} onChange={update("businessPhone")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Specialty" value={form.specialty} onChange={update("specialty")} />
            <FormField label="Website" type="url" value={form.website} onChange={update("website")} />
          </div>
        </FormSection>

        <FormSection title="Medical license">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Name on license" required value={form.licenseHolderName} onChange={update("licenseHolderName")} />
            <FormField label="License type" required value={form.profession} onChange={update("profession")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="License number" required value={form.licenseNumber} onChange={update("licenseNumber")} />
            <FormField label="Expiry date" type="date" required value={form.licenseExpiry} onChange={update("licenseExpiry")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="State issued" required value={form.licenseState} onChange={update("licenseState")} />
            <FormField label="Country issued" required value={form.licenseCountry} onChange={update("licenseCountry")} />
          </div>
        </FormSection>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors mt-1 disabled:opacity-60 self-start"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
