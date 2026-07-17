"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendUserPasswordReset, setUserRole } from "@/app/actions/admin-users";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Send a password reset email to this user?")) return;
    startTransition(async () => {
      const result = await sendUserPasswordReset(userId);
      if (result.ok) toast.success(result.message ?? "Reset email sent");
      else toast.error(result.message);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-[12.5px] text-teal hover:underline disabled:opacity-60"
    >
      {pending ? "Sending…" : "Reset password"}
    </button>
  );
}

export function ToggleRoleButton({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nextRole = currentRole === "admin" ? "customer" : "admin";

  function handleClick() {
    if (!window.confirm(`${nextRole === "admin" ? "Promote this user to admin" : "Remove admin access"}?`)) return;
    startTransition(async () => {
      const result = await setUserRole(userId, nextRole);
      if (result.ok) {
        toast.success(result.message ?? "Updated");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  if (isSelf) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`text-[12.5px] hover:underline disabled:opacity-60 ${
        nextRole === "admin" ? "text-teal" : "text-low"
      }`}
    >
      {pending ? "…" : nextRole === "admin" ? "Make admin" : "Remove admin"}
    </button>
  );
}
