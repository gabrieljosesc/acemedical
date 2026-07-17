import Link from "next/link";
import { Mail, Phone, Printer } from "lucide-react";

const SHOP_LINKS = [
  { href: "/shop/dermal-fillers", label: "Dermal fillers" },
  { href: "/shop/botulinum-toxins", label: "Botulinum toxins" },
  { href: "/shop/orthopedic-injections", label: "Orthopedic injections" },
  { href: "/shop/threads", label: "Threads" },
  { href: "/shop", label: "All categories" },
];

const ACCOUNT_LINKS = [
  { href: "/auth/login", label: "Trade login" },
  { href: "/trade/apply", label: "Apply for wholesale" },
  { href: "/account/orders", label: "Order history" },
  { href: "/trade/terms", label: "Net-30 terms" },
  { href: "/account/orders", label: "Track a shipment" },
];

const SUPPORT_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/blog", label: "Blog" },
  { href: "/referral", label: "Referral & rewards" },
  { href: "/shipping", label: "Shipping & cold-chain" },
  { href: "/returns", label: "Returns & recalls" },
  { href: "/authenticity", label: "Authenticity policy" },
  { href: "/contact", label: "Contact us" },
  { href: "/faq", label: "FAQ" },
];

export default function Footer() {
  return (
    <footer className="bg-ground border-t border-line pt-14 pb-8">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-9 pb-10 border-b border-line">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex flex-col">
              <span className="font-serif font-semibold text-[23px] tracking-tight text-ink leading-none">
                Ace<span className="text-teal">Medical</span>
              </span>
              <span className="font-mono text-[9px] uppercase text-ink-faint tracking-[0.53em] -mr-[0.53em] mt-1 leading-none">
                Wholesale
              </span>
            </Link>
            <p className="text-[13.5px] text-ink-soft max-w-[34ch] leading-relaxed mt-4">
              Specialty medical and aesthetic supply for licensed clinics.
              Authentic brand-name stock, shipped cold-chain nationwide.
            </p>
            <div className="flex flex-col gap-2 mt-4 font-mono text-[12.5px] text-ink-soft">
              <a href="tel:+18004651525" className="inline-flex gap-2 items-center hover:text-teal transition-colors">
                <Phone size={14} className="text-teal" />
                1-800-465-1525
              </a>
              <span className="inline-flex gap-2 items-center">
                <Printer size={14} className="text-teal" />
                FAX 1-855-809-1511
              </span>
              <a href="mailto:info@acemedicalwholesale.com" className="inline-flex gap-2 items-center hover:text-teal transition-colors">
                <Mail size={14} className="text-teal" />
                info@acemedicalwholesale.com
              </a>
            </div>
          </div>

          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Account" links={ACCOUNT_LINKS} />
          <FooterColumn title="Support" links={SUPPORT_LINKS} />
        </div>

        <div className="flex flex-wrap justify-between gap-4 pt-5 font-mono text-[11.5px] text-ink-faint">
          <span>© {new Date().getFullYear()} Ace Medical Wholesale</span>
          <span className="flex gap-5">
            <Link href="/legal/privacy" className="hover:text-teal transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-teal transition-colors">Terms</Link>
            <Link href="/legal/licensing" className="hover:text-teal transition-colors">Licensing</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-faint font-medium mb-3.5">
        {title}
      </h4>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-[13.5px] text-ink-soft hover:text-teal transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
