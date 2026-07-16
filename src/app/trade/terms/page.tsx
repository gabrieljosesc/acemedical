import { InfoPage, InfoSection } from "@/components/info/InfoPage";

export const metadata = { title: "Net-30 terms" };

export default function NetTermsPage() {
  return (
    <InfoPage
      eyebrow="Trade accounts"
      title="Net-30 terms"
      lede="Payment terms for established trade accounts."
    >
      <InfoSection title="How it works">
        <p>
          New accounts start with card-on-file payment, processed by our team at order approval. After a
          history of completed orders, accounts can request net-30 invoicing — pay within 30 days of
          dispatch instead of at approval.
        </p>
      </InfoSection>
      <InfoSection title="Requesting terms">
        <p>
          Contact us with your account email and typical monthly volume. Approval is at our discretion and
          reviewed periodically.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
