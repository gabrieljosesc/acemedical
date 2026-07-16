"use client";

import { useState, type FormEvent } from "react";
import { Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { submitContactMessage } from "@/app/actions/contact";
import { FormField } from "@/components/forms/FormField";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const result = await submitContactMessage(form);
    setSending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    toast.success("Message sent");
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-[760px] px-5 sm:px-10 py-14 sm:py-20">
      <p className="eyebrow">Support</p>
      <h1 className="font-serif font-medium text-[32px] sm:text-[40px] tracking-tight mt-2">Contact us</h1>
      <p className="text-[16px] text-ink-soft mt-3 leading-relaxed">
        Questions about an order, product availability, or opening a trade account — we respond within one
        business day.
      </p>

      <div className="flex gap-6 flex-wrap mt-6 font-mono text-[13px] text-ink-soft">
        <a href="tel:+18005550142" className="inline-flex gap-2 items-center hover:text-teal transition-colors">
          <Phone size={14} className="text-teal" /> 1-800-555-0142
        </a>
        <a href="mailto:orders@acemedicalwholesale.com" className="inline-flex gap-2 items-center hover:text-teal transition-colors">
          <Mail size={14} className="text-teal" /> orders@acemedicalwholesale.com
        </a>
      </div>

      {sent ? (
        <div className="mt-9 bg-stock-bg border border-stock/30 rounded-[4px] px-5 py-6 text-center">
          <p className="text-[16px] font-medium text-stock">Message received</p>
          <p className="text-[13.5px] text-ink-soft mt-1">We&apos;ll get back to you within one business day.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-3">
          {error && (
            <p className="text-[13px] text-low bg-low-bg border border-low/30 rounded-sm px-3 py-2.5">{error}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <FormField label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <FormField label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <FormField label="Subject" required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink">
              Message <span className="text-low">*</span>
            </span>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="border border-line rounded-sm px-3 py-2.5 text-[14px] bg-card outline-none focus:border-teal transition-colors resize-none"
            />
          </label>
          <button
            type="submit"
            disabled={sending}
            className="self-start rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14px] px-6 py-3 hover:bg-teal-deep transition-colors disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
