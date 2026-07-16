import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, UserPlus, Send, Gift } from "lucide-react";

export const metadata: Metadata = {
  title: "Referral & rewards",
  description: "Refer a licensed colleague to Ace Medical Wholesale and you both earn credit toward your next order.",
};

const STEPS = [
  {
    icon: Send,
    title: "Refer a colleague",
    body: "Share Ace Medical with a licensed practitioner or clinic — just have them mention your account email when they register.",
  },
  {
    icon: UserPlus,
    title: "They get verified",
    body: "Once their trade account is verified and their first order is approved, the referral counts.",
  },
  {
    icon: Gift,
    title: "You both earn credit",
    body: "You each receive a $50 credit applied to your next order by our team — no codes, no hoops.",
  },
];

export default function ReferralPage() {
  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-10 py-14 sm:py-20">
      <p className="eyebrow">Trade accounts</p>
      <h1 className="font-serif font-medium text-[32px] sm:text-[44px] tracking-tight mt-2 text-balance">
        Refer a colleague, <em className="not-italic font-serif italic text-teal">both of you earn.</em>
      </h1>
      <p className="text-[16px] text-ink-soft mt-4 max-w-[56ch] leading-relaxed">
        The best clinics hear about us from other clinics. When a colleague you refer places their first
        approved order, we credit both accounts — a thank-you that shows up on your very next invoice.
      </p>

      <div className="grid sm:grid-cols-3 gap-3.5 mt-10">
        {STEPS.map((s, i) => (
          <div key={s.title} className="bg-card border border-line rounded-[4px] p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="font-mono text-[11px] text-teal border border-teal/40 rounded-full w-7 h-7 flex items-center justify-center">
                {i + 1}
              </span>
              <s.icon size={18} className="text-teal" />
            </div>
            <h2 className="text-[15px] font-medium text-ink mb-1">{s.title}</h2>
            <p className="text-[12.5px] text-ink-soft leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap mt-10">
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors"
        >
          Open a trade account
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-sm border border-line-strong text-ink font-medium text-[14.5px] px-5.5 py-3.5 hover:border-ink-soft transition-colors"
        >
          Ask about a referral
        </Link>
      </div>

      <p className="text-[12px] text-ink-faint mt-8 max-w-[60ch]">
        Referral credit is applied manually by our team after the referred account&apos;s first order is
        approved. One credit per referred account; credits have no cash value.
      </p>
    </div>
  );
}
