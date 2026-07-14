export default function ProductVisual({ categoryLabel }: { categoryLabel: string }) {
  return (
    <div className="bg-card border border-line-strong rounded-[4px] aspect-[4/5] flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-teal-tint to-transparent">
      <span className="absolute top-4 left-4 eyebrow">{categoryLabel}</span>
      <div className="w-[92px] h-[260px] relative">
        <span className="absolute left-7 right-7 top-0 h-9 bg-teal rounded-[5px]" />
        <span className="absolute left-9 right-9 top-9 h-8 bg-teal/20 border-x border-t border-teal" />
        <span className="absolute left-3.5 right-3.5 top-[60px] bottom-0 bg-teal/[0.22] border-[1.5px] border-teal rounded-t-[10px] rounded-b-[14px]" />
        <span className="absolute left-5 right-5 bottom-[6px] h-28 bg-teal/85 rounded-[5px]" />
        <span className="absolute left-5 right-5 top-[92px] h-px bg-teal/40" />
        <span className="absolute left-5 right-5 top-[112px] h-px bg-teal/40" />
      </div>
    </div>
  );
}
