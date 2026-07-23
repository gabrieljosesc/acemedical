import { InfoPage, InfoSection } from "@/components/info/InfoPage";

export const metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Specialty supply, done properly."
      lede="Ace Medical Wholesale supplies licensed clinics and practitioners with brand-name injectables, dermal fillers, and aesthetic products — sourced authentic and shipped cold-chain nationwide."
    >
      <InfoSection title="Who we serve">
        <p>
          We work exclusively with credentialed medical professionals: dermatology and aesthetic clinics,
          orthopaedic and rheumatology practices, med spas under physician direction, and hospital
          purchasing groups. Every account is verified against a current medical license before trade
          pricing is unlocked.
        </p>
      </InfoSection>
      <InfoSection title="How we source">
        <p>
          Every product is sourced through authorized distribution channels with full batch traceability.
          We stock the brands clinics actually reorder — Juvéderm, Botox, Restylane, Dysport, Xeomin,
          Synvisc, and more than ninety others — at true trade prices, with volume tiers on eligible
          products.
        </p>
      </InfoSection>
      <InfoSection title="How we ship">
        <p>
          Temperature-sensitive products are packed cold-chain and dispatched within 24 hours of approval,
          fully insured and tracked door to door. Your first order always ships free — after that, shipping
          is free on orders of $800 or more, $50 on orders of $500–$800, and $100 on orders under $500.
        </p>
      </InfoSection>
      <InfoSection title="How payment works">
        <p>
          No card is ever charged online. Your card details are encrypted on file, and our team processes
          payment directly once your order is reviewed and approved — with net-30 terms available for
          established accounts.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
