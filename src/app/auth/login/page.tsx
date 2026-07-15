"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PasswordField from "@/components/auth/PasswordField";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next || "/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[420px] px-5 py-16 sm:py-24">
      <p className="eyebrow">Trade account</p>
      <h1 className="font-serif font-medium text-[30px] tracking-tight mt-2 mb-8">Sign in</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="text-[13px] text-low bg-low-bg border border-low/30 rounded-sm px-3 py-2.5">{error}</p>
        )}

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

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors mt-2 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="text-[13.5px] text-ink-soft mt-6">
        No account yet?{" "}
        <Link href="/auth/signup" className="text-teal hover:underline">
          Apply for a trade account
        </Link>
      </p>
    </div>
  );
}
