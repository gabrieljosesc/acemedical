"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { savePrivacySettings } from "@/app/actions/account";

export default function PrivacyForm({ initial }: { initial: { analyticsOptIn: boolean } }) {
  const [analyticsOptIn, setAnalyticsOptIn] = useState(initial.analyticsOptIn);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await savePrivacySettings({ analyticsOptIn });
    setSaving(false);
    if (result.ok) {
      toast.success("Preferences saved");
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div>
      <h1 className="font-serif font-medium text-[28px] tracking-tight">Privacy</h1>
      <p className="text-[14px] text-ink-soft mt-1 mb-7">Control how your data is used.</p>

      <form onSubmit={handleSubmit} className="bg-card border border-line rounded-[4px] p-5 sm:p-6 max-w-[520px] flex flex-col gap-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={analyticsOptIn}
            onChange={(e) => setAnalyticsOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-teal shrink-0"
          />
          <span>
            <span className="block text-[14px] font-medium text-ink">Product improvement</span>
            <span className="block text-[12.5px] text-ink-soft mt-0.5">
              Allow anonymized usage data to help us improve the catalog and ordering experience.
            </span>
          </span>
        </label>

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
