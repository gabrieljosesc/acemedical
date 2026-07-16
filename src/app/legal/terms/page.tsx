import { InfoPage, InfoSection } from "@/components/info/InfoPage";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of service"
      lede="The terms that govern trade accounts and orders on Ace Medical Wholesale."
    >
      <InfoSection title="Eligibility">
        <p>
          Accounts are for licensed medical professionals and the businesses they direct. You confirm at
          registration that your license information is accurate and current, and that you’re authorized to
          purchase regulated medical and aesthetic supplies.
        </p>
      </InfoSection>
      <InfoSection title="Orders & payment">
        <p>
          Placing an order is a purchase request: it’s reviewed by our team before payment is processed on
          your card on file. Prices, including volume tiers, are confirmed at review. Net-30 terms are
          available for established accounts at our discretion.
        </p>
      </InfoSection>
      <InfoSection title="Professional use">
        <p>
          Products are supplied for professional use within your licensed scope of practice. You’re
          responsible for storage, handling, and administration in line with the manufacturer’s guidance.
        </p>
      </InfoSection>
      <InfoSection title="Liability">
        <p>
          Our liability is limited to the purchase price of the products supplied. Nothing in these terms
          limits liability that cannot be limited by law.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
