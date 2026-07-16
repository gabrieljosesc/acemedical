"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import PasswordField from "@/components/auth/PasswordField";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes("session")
          ? "Your reset link has expired — request a new one from the sign-in page."
          : error.message
      );
      return;
    }
    toast.success("Password updated — you're signed in");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[420px] px-5 py-16 sm:py-24">
      <p className="eyebrow">Trade account</p>
      <h1 className="font-serif font-medium text-[30px] tracking-tight mt-2 mb-2">Set a new password</h1>
      <p className="text-[14px] text-ink-soft mb-8">
        Pick a strong password you don&apos;t use anywhere else.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="text-[13px] text-low bg-low-bg border border-low/30 rounded-sm px-3 py-2.5">{error}</p>
        )}

        <PasswordField
          label="New password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="new-password"
          hint="At least 8 characters with 1 uppercase letter, 1 number, and 1 special character."
        />
        <PasswordField
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors mt-2 disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
