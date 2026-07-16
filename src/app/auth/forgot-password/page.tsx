"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    // Always show the sent state regardless of outcome — never reveal
    // whether an email is registered (prevents account enumeration).
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-[420px] px-5 py-16 sm:py-24 text-center">
        <p className="eyebrow">Trade account</p>
        <h1 className="font-serif font-medium text-[26px] tracking-tight mt-2 mb-3">Check your email</h1>
        <p className="text-[14.5px] text-ink-soft">
          If an account exists for <span className="text-ink font-medium">{email}</span>, we&apos;ve sent a
          link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[420px] px-5 py-16 sm:py-24">
      <p className="eyebrow">Trade account</p>
      <h1 className="font-serif font-medium text-[30px] tracking-tight mt-2 mb-2">Reset your password</h1>
      <p className="text-[14px] text-ink-soft mb-8">
        Enter your account email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors"
            placeholder="you@clinic.com"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors mt-2 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="text-[13.5px] text-ink-soft mt-6">
        Remembered it?{" "}
        <Link href="/auth/login" className="text-teal hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
