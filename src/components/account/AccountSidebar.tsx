"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  CreditCard,
  MapPin,
  Lock,
  Bell,
  Shield,
  Package,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ACCOUNT_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Profile", href: "/account/profile", icon: User },
  { label: "Banks & Cards", href: "/account/payment-methods", icon: CreditCard },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Change Password", href: "/account/password", icon: Lock },
  { label: "Notifications", href: "/account/notifications", icon: Bell },
  { label: "Privacy", href: "/account/privacy", icon: Shield },
];

export default function AccountSidebar({
  displayName,
  email,
  avatarUrl,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const linkClass = (active: boolean) =>
    `flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-[13.5px] transition-colors ${
      active ? "bg-teal text-[#F4FBF8] font-medium" : "text-ink-soft hover:bg-surface hover:text-ink"
    }`;

  return (
    <aside className="w-full">
      <div className="bg-card border border-line rounded-[4px] p-4 flex items-center gap-3 mb-5">
        <div className="w-[52px] h-[52px] rounded-full bg-teal text-[#F4FBF8] flex items-center justify-center text-[18px] font-medium shrink-0 relative overflow-hidden">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="52px" unoptimized />
          ) : (
            displayName.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[14.5px] font-medium text-ink truncate">{displayName}</p>
          <p className="text-[12px] text-ink-faint truncate">{email}</p>
          <Link href="/account/profile" className="text-[12px] text-teal hover:underline">
            Edit profile
          </Link>
        </div>
      </div>

      <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        <p className="eyebrow px-3 pb-1.5 hidden lg:block">My account</p>
        {ACCOUNT_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`${linkClass(pathname === l.href)} whitespace-nowrap`}>
            <l.icon size={16} className="shrink-0" />
            {l.label}
          </Link>
        ))}

        <p className="eyebrow px-3 pt-4 pb-1.5 hidden lg:block">Orders</p>
        <Link
          href="/account/orders"
          className={`${linkClass(pathname?.startsWith("/account/orders") ?? false)} whitespace-nowrap`}
        >
          <Package size={16} className="shrink-0" />
          My Orders
        </Link>

        <p className="eyebrow px-3 pt-4 pb-1.5 hidden lg:block">Session</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-[13.5px] text-low border border-low/30 hover:bg-low-bg transition-colors whitespace-nowrap lg:w-full text-left"
        >
          <LogOut size={16} className="shrink-0" />
          Log Out
        </button>
      </nav>
    </aside>
  );
}
