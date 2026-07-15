"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { changePassword } from "@/app/actions/account";
import PasswordField from "@/components/auth/PasswordField";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await changePassword({ newPassword, confirmPassword });

    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    toast.success("Password updated");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div>
      <h1 className="font-serif font-medium text-[28px] tracking-tight">Change Password</h1>
      <p className="text-[14px] text-ink-soft mt-1 mb-7">
        Pick a strong password you don&apos;t use anywhere else.
      </p>

      <form onSubmit={handleSubmit} className="bg-card border border-line rounded-[4px] p-5 sm:p-6 max-w-[440px] flex flex-col gap-4">
        {error && (
          <p className="text-[13px] text-low bg-low-bg border border-low/30 rounded-sm px-3 py-2.5">{error}</p>
        )}

        <PasswordField
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          required
          autoComplete="new-password"
          hint="At least 8 characters with 1 uppercase letter, 1 number, and 1 special character."
        />
        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-5 py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
