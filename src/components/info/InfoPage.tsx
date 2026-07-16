export function InfoPage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[760px] px-5 sm:px-10 py-14 sm:py-20">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-serif font-medium text-[32px] sm:text-[40px] tracking-tight mt-2 text-balance">{title}</h1>
      {lede && <p className="text-[16px] text-ink-soft mt-3 max-w-[56ch] leading-relaxed">{lede}</p>}
      <div className="mt-9 flex flex-col gap-7">{children}</div>
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="font-serif font-medium text-[20px] tracking-tight mb-2.5">{title}</h2>
      <div className="text-[14.5px] text-ink-soft leading-relaxed flex flex-col gap-2.5">{children}</div>
    </section>
  );
}
