"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AccountMenu({ firstName, isAdmin }: { firstName: string; isAdmin?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hidden sm:inline-flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-surface transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-teal text-[#F4FBF8] text-[12px] font-medium flex items-center justify-center shrink-0">
          {firstName.slice(0, 1).toUpperCase() || "?"}
        </span>
        <span className="text-[13px] text-ink-soft">
          Hi, <span className="text-ink font-medium">{firstName}</span>
        </span>
        <ChevronDown size={14} className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[180px] bg-card border border-line rounded-sm shadow-[0_12px_28px_-12px_rgba(8,40,32,0.25)] py-1.5 z-50">
          <Link
            href="/account/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-[13.5px] text-ink hover:bg-surface transition-colors"
          >
            My account
          </Link>
          <Link
            href="/account/orders"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-[13.5px] text-ink hover:bg-surface transition-colors"
          >
            My orders
          </Link>
          {isAdmin && (
            <Link
              href="/admin/orders"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-[13.5px] text-teal hover:bg-surface transition-colors"
            >
              Admin panel
            </Link>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-[13.5px] text-ink hover:bg-surface transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
