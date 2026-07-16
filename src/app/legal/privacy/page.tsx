import { InfoPage, InfoSection } from "@/components/info/InfoPage";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy policy"
      lede="What we collect, why we collect it, and what we never do with it."
    >
      <InfoSection title="What we collect">
        <p>
          Account details (name, contact, clinic, and medical license information required for trade
          verification), order history, delivery addresses, and — if you save one — encrypted payment card
          details. Card numbers are encrypted at rest and never charged online.
        </p>
      </InfoSection>
      <InfoSection title="How we use it">
        <p>
          To verify trade eligibility, fulfil and support your orders, and — only if you opt in — send
          product news. Anonymized usage data helps us improve the catalog; you can opt out any time in
          Account → Privacy.
        </p>
      </InfoSection>
      <InfoSection title="What we never do">
        <p>We never sell your data, and we never share it beyond the carriers and processors needed to fulfil your order.</p>
      </InfoSection>
      <InfoSection title="Your choices">
        <p>
          You can update your details, manage notification preferences, and remove saved cards or addresses
          from your account at any time. To delete your account entirely, contact us.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
