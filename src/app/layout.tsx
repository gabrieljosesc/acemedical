import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CartProvider } from "@/hooks/useCart";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: {
    default: "Ace Medical Wholesale — Specialty Medical & Aesthetic Supply",
    template: "%s | Ace Medical Wholesale",
  },
  description:
    "The wholesale catalog for licensed clinics — dermal fillers, orthopaedic injectables, and botulinum toxins, sourced authentic and shipped cold-chain nationwide.",
  keywords: [
    "medical wholesale",
    "dermal fillers",
    "botox",
    "orthopaedic injectables",
    "aesthetic supply",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "Ace Medical Wholesale",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ground text-ink">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="top-right" richColors />
        </CartProvider>
      </body>
    </html>
  );
}
