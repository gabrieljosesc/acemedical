"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { saveNotificationSettings } from "@/app/actions/account";

export default function NotificationsForm({
  initial,
}: {
  initial: { emailOrderUpdates: boolean; emailProductNews: boolean };
}) {
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await saveNotificationSettings(prefs);
    setSaving(false);
    if (result.ok) {
      toast.success("Preferences saved");
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div>
      <h1 className="font-serif font-medium text-[28px] tracking-tight">Notifications</h1>
      <p className="text-[14px] text-ink-soft mt-1 mb-7">Choose what we email you about.</p>

      <form onSubmit={handleSubmit} className="bg-card border border-line rounded-[4px] p-5 sm:p-6 max-w-[520px] flex flex-col gap-5">
        <Toggle
          label="Order updates"
          description="Confirmation, approval, and shipping updates for your orders."
          checked={prefs.emailOrderUpdates}
          onChange={(v) => setPrefs((p) => ({ ...p, emailOrderUpdates: v }))}
        />
        <Toggle
          label="Product news"
          description="New stock, price changes, and occasional offers."
          checked={prefs.emailProductNews}
          onChange={(v) => setPrefs((p) => ({ ...p, emailProductNews: v }))}
        />

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-5 py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-teal shrink-0"
      />
      <span>
        <span className="block text-[14px] font-medium text-ink">{label}</span>
        <span className="block text-[12.5px] text-ink-soft mt-0.5">{description}</span>
      </span>
    </label>
  );
}
