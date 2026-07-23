import { InfoPage, InfoSection } from "@/components/info/InfoPage";

export const metadata = { title: "FAQ" };

const FAQS: { q: string; a: string }[] = [
  {
    q: "Who can order from Ace Medical Wholesale?",
    a: "Licensed medical professionals and the clinics they direct. Registration collects your medical license details, and orders are reviewed before payment is processed.",
  },
  {
    q: "Are your products authentic?",
    a: "Yes — 100% authentic, sourced through authorized channels with full batch traceability. We never stock grey-market or repackaged product.",
  },
  {
    q: "When is my card charged?",
    a: "Never at checkout. Your card is encrypted on file and our team processes payment directly once your order is approved. If a charge fails, you’ll get an email with a secure link to update your card.",
  },
  {
    q: "How fast do orders ship?",
    a: "Approved orders are packed cold-chain and dispatched within 24 hours, tracked door to door. Your first order always ships free. After that, shipping is free on orders of $800+, $50 on orders of $500–$800, and $100 on orders under $500.",
  },
  {
    q: "Do you offer volume pricing?",
    a: "Yes — eligible products show quantity tiers on the product page, and the discount applies automatically in your cart as the quantity increases.",
  },
  {
    q: "Can I return a product?",
    a: "Unopened, room-temperature products can be returned within 14 days. Cold-chain items can’t be returned once shipped, but we make damaged or incorrect shipments right — see the Returns page.",
  },
  {
    q: "How do I track my order?",
    a: "Sign in and open My Orders — every order shows its live status (Pending Review, Confirmed, Shipped), and you’ll receive email updates at each step.",
  },
];

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Frequently asked questions"
      lede="The short answers. If yours isn’t here, contact us — we respond within one business day."
    >
      {FAQS.map((f) => (
        <InfoSection key={f.q} title={f.q}>
          <p>{f.a}</p>
        </InfoSection>
      ))}
    </InfoPage>
  );
}
