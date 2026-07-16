import { InfoPage, InfoSection } from "@/components/info/InfoPage";

export const metadata = { title: "Licensing" };

export default function LicensingPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Licensing requirements"
      lede="Why we ask for a medical license, and what we do with it."
    >
      <InfoSection title="Why licensing matters">
        <p>
          The products we supply are regulated. Requiring a verified medical license on every account is
          how we keep them in professional hands — it protects patients, practitioners, and the supply
          chain.
        </p>
      </InfoSection>
      <InfoSection title="What we verify">
        <p>
          The license holder’s name, license type and number, issuing state and country, and expiry date —
          collected at registration and reviewed before orders are approved. If you’re the business owner,
          the license can belong to a practitioner at your clinic.
        </p>
      </InfoSection>
      <InfoSection title="Keeping it current">
        <p>
          Keep your license details up to date in Account → Profile. Orders placed under an expired license
          will be held until updated details are verified.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
