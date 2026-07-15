"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, flattenErrors } from "@/lib/validation/register-schema";
import PasswordField from "@/components/auth/PasswordField";
import { FormField, FormSelect, FormSection } from "@/components/forms/FormField";

const initialForm = {
  email: "",
  confirmEmail: "",
  password: "",
  confirmPassword: "",
  prefix: "",
  firstName: "",
  middleName: "",
  lastName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  company: "",
  businessPhone: "",
  specialty: "",
  website: "",
  licenseHolderName: "",
  profession: "",
  licenseNumber: "",
  licenseExpiry: "",
  licenseState: "",
  licenseCountry: "",
};

type FormState = typeof initialForm;

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      setFieldErrors(flattenErrors(result.error));
      return;
    }
    if (!agreed) {
      setGlobalError("Please confirm you're a licensed professional authorized to purchase these products.");
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          prefix: form.prefix,
          first_name: form.firstName,
          middle_name: form.middleName,
          last_name: form.lastName,
          phone: form.phone,
          address_line1: form.addressLine1,
          city: form.city,
          state: form.state,
          postal_code: form.postalCode,
          country: form.country,
          company: form.company,
          business_phone: form.businessPhone,
          specialty: form.specialty,
          website: form.website,
          license_holder_name: form.licenseHolderName,
          profession: form.profession,
          license_number: form.licenseNumber,
          license_expiry: form.licenseExpiry,
          license_state: form.licenseState,
          license_country: form.licenseCountry,
        },
      },
    });

    setLoading(false);
    if (error) {
      setGlobalError(error.message);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <div className="mx-auto max-w-[420px] px-5 py-16 sm:py-24 text-center">
        <p className="eyebrow">Trade account</p>
        <h1 className="font-serif font-medium text-[26px] tracking-tight mt-2 mb-3">Check your email</h1>
        <p className="text-[14.5px] text-ink-soft">
          We&apos;ve sent a confirmation link to <span className="text-ink font-medium">{form.email}</span>.
          Confirm your address to activate your trade account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-5 py-16 sm:py-20">
      <p className="eyebrow">Trade account</p>
      <h1 className="font-serif font-medium text-[30px] tracking-tight mt-2 mb-2">Create an account</h1>
      <p className="text-[14px] text-ink-soft mb-1">
        For licensed medical professionals only. Fields marked <span className="text-low">*</span> are required.
      </p>
      <p className="text-[12.5px] text-ink-faint mb-8">
        By registering you agree to our{" "}
        <Link href="/legal/terms" className="text-teal hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="text-teal hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {globalError && (
          <p className="text-[13.5px] text-low bg-low-bg border border-low/30 rounded-sm px-3.5 py-3">
            {globalError}
          </p>
        )}

        <FormSection title="Account">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Email" type="email" required value={form.email} onChange={update("email")} error={fieldErrors.email} span2 />
            <FormField label="Confirm email" type="email" required value={form.confirmEmail} onChange={update("confirmEmail")} error={fieldErrors.confirmEmail} span2 />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <PasswordField label="Password *" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} autoComplete="new-password" />
            <PasswordField label="Confirm password *" value={form.confirmPassword} onChange={(v) => setForm((f) => ({ ...f, confirmPassword: v }))} autoComplete="new-password" />
          </div>
          {(fieldErrors.password || fieldErrors.confirmPassword) && (
            <p className="text-[12px] text-low -mt-2">{fieldErrors.password || fieldErrors.confirmPassword}</p>
          )}
          <p className="text-[11.5px] text-ink-faint -mt-1">
            At least 8 characters with 1 uppercase letter, 1 number, and 1 special character.
          </p>
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
            <FormField label="First name" required value={form.firstName} onChange={update("firstName")} error={fieldErrors.firstName} />
            <FormField label="Middle name" value={form.middleName} onChange={update("middleName")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Last name" required value={form.lastName} onChange={update("lastName")} error={fieldErrors.lastName} />
            <FormField label="Phone" type="tel" required value={form.phone} onChange={update("phone")} error={fieldErrors.phone} />
          </div>
        </FormSection>

        <FormSection title="Delivery address">
          <FormField label="Street address" required value={form.addressLine1} onChange={update("addressLine1")} error={fieldErrors.addressLine1} span2 />
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="City" required value={form.city} onChange={update("city")} error={fieldErrors.city} />
            <FormField label="State / province" required value={form.state} onChange={update("state")} error={fieldErrors.state} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="ZIP / postal code" required value={form.postalCode} onChange={update("postalCode")} error={fieldErrors.postalCode} />
            <FormField label="Country" required value={form.country} onChange={update("country")} error={fieldErrors.country} />
          </div>
        </FormSection>

        <FormSection title="Business information">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Company / clinic name" required value={form.company} onChange={update("company")} error={fieldErrors.company} />
            <FormField label="Business phone" type="tel" required value={form.businessPhone} onChange={update("businessPhone")} error={fieldErrors.businessPhone} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Specialty" value={form.specialty} onChange={update("specialty")} placeholder="e.g. Dermatology, Aesthetics" />
            <FormField label="Website" type="url" value={form.website} onChange={update("website")} placeholder="https://yourclinic.com" />
          </div>
        </FormSection>

        <FormSection title="Medical license">
          <p className="text-[12.5px] text-ink-faint -mt-1 mb-1">
            Details of the licensed professional these orders are placed under. If you&apos;re the business
            owner, this can be a doctor at your clinic.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Name on license" required value={form.licenseHolderName} onChange={update("licenseHolderName")} error={fieldErrors.licenseHolderName} />
            <FormField label="License type" required value={form.profession} onChange={update("profession")} error={fieldErrors.profession} placeholder="e.g. Physician, Nurse Practitioner" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="License number" required value={form.licenseNumber} onChange={update("licenseNumber")} error={fieldErrors.licenseNumber} />
            <FormField label="Expiry date" type="date" required value={form.licenseExpiry} onChange={update("licenseExpiry")} error={fieldErrors.licenseExpiry} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="State issued" required value={form.licenseState} onChange={update("licenseState")} error={fieldErrors.licenseState} placeholder="e.g. California, Ontario" />
            <FormField label="Country issued" required value={form.licenseCountry} onChange={update("licenseCountry")} error={fieldErrors.licenseCountry} placeholder="e.g. United States, Canada" />
          </div>
        </FormSection>

        <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-teal shrink-0"
          />
          <span className="text-[12.5px] text-ink-soft leading-relaxed">
            I confirm I am a licensed medical professional authorized to purchase regulated medical / aesthetic
            supplies, and that my license information is accurate and current.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors mt-1 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="text-[13.5px] text-ink-soft mt-6 text-center">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-teal hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
