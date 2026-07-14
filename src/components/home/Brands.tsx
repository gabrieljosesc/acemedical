const BRANDS = [
  "Juvéderm",
  "Botox",
  "Xeomin",
  "Restylane",
  "Synvisc",
  "Radiesse",
  "Sculptra",
  "Hyalgan",
];

export default function Brands() {
  return (
    <div className="border-y border-line bg-surface">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-8.5">
        <div className="text-center font-mono text-[11px] tracking-[0.14em] uppercase text-ink-faint mb-5.5">
          Trusted brands, stocked in depth
        </div>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-3.5 items-center">
          {BRANDS.map((b) => (
            <span
              key={b}
              className="font-serif font-medium text-[23px] text-ink-soft/85 tracking-tight hover:text-teal hover:opacity-100 transition-colors cursor-default"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
