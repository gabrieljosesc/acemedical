"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          company: form.company,
          phone: form.phone,
        },
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
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
    <div className="mx-auto max-w-[460px] px-5 py-16 sm:py-24">
      <p className="eyebrow">Trade account</p>
      <h1 className="font-serif font-medium text-[30px] tracking-tight mt-2 mb-2">Apply for a trade account</h1>
      <p className="text-[14px] text-ink-soft mb-8">
        For licensed clinics and practitioners. Verify once, unlock trade-net pricing.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="text-[13px] text-low bg-low-bg border border-low/30 rounded-sm px-3 py-2.5">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" value={form.firstName} onChange={update("firstName")} required />
          <Field label="Last name" value={form.lastName} onChange={update("lastName")} required />
        </div>

        <Field label="Practice / company" value={form.company} onChange={update("company")} required />
        <Field label="Phone" type="tel" value={form.phone} onChange={update("phone")} />
        <Field label="Email" type="email" value={form.email} onChange={update("email")} required />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={update("password")}
          required
          minLength={8}
        />

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors mt-2 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="text-[13.5px] text-ink-soft mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-teal hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  required,
  minLength,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors"
      />
    </label>
  );
}
