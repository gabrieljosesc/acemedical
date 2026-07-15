import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = { title: "Order confirmed" };

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="mx-auto max-w-[560px] px-5 py-24 text-center">
      <CheckCircle2 size={44} className="text-stock mx-auto mb-5" />
      <p className="eyebrow">Order received</p>
      <h1 className="font-serif font-medium text-[30px] tracking-tight mt-2 mb-4">Thank you for your order.</h1>

      {ref && (
        <div className="inline-block bg-teal-tint border border-line rounded-sm px-5 py-3 mb-6">
          <span className="font-mono text-[11px] tracking-wide uppercase text-ink-faint">Reference number</span>
          <div className="font-mono tabular text-[20px] text-teal font-medium">{ref}</div>
        </div>
      )}

      <p className="text-[14.5px] text-ink-soft mb-9 max-w-[42ch] mx-auto leading-relaxed">
        Our team will review your order and process payment on your card on file. You&apos;ll receive a
        confirmation once it&apos;s approved and dispatched cold-chain.
      </p>

      <Link
        href="/shop"
        className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[14.5px] px-5.5 py-3.5 hover:bg-teal-deep transition-colors"
      >
        Continue shopping
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
