import Link from "next/link";
import type { ShopParams } from "@/components/shop/ShopFilters";

export default function Pagination({
  pathname,
  current,
  page,
  totalPages,
}: {
  pathname: string;
  current: ShopParams;
  page: number;
  totalPages: number;
}) {
  function buildUrl(p: number) {
    const merged: Record<string, string | undefined> = { ...current, page: p > 1 ? String(p) : undefined };
    const qs = Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const windowSize = 7;
  const pages = Array.from({ length: Math.min(totalPages, windowSize) }, (_, i) => {
    if (totalPages <= windowSize) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - windowSize + 1 + i;
    return page - 3 + i;
  });

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-2" aria-label="Pagination">
      <PageLink href={buildUrl(page - 1)} disabled={page === 1} label="Prev" />

      {pages[0] > 1 && (
        <>
          <PageLink href={buildUrl(1)} label="1" />
          {pages[0] > 2 && <span className="text-ink-faint px-1">…</span>}
        </>
      )}

      {pages.map((p) => (
        <PageLink key={p} href={buildUrl(p)} label={String(p)} active={p === page} />
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-ink-faint px-1">…</span>}
          <PageLink href={buildUrl(totalPages)} label={String(totalPages)} />
        </>
      )}

      <PageLink href={buildUrl(page + 1)} disabled={page === totalPages} label="Next" />
    </nav>
  );
}

function PageLink({
  href,
  label,
  active,
  disabled,
}: {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="font-mono text-[12.5px] px-3 py-1.5 rounded-sm text-ink-faint/50 cursor-not-allowed">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`font-mono text-[12.5px] px-3 py-1.5 rounded-sm transition-colors ${
        active ? "bg-teal text-[#F4FBF8]" : "text-ink-soft border border-line hover:border-line-strong"
      }`}
    >
      {label}
    </Link>
  );
}
