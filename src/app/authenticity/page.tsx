import { InfoPage, InfoSection } from "@/components/info/InfoPage";

export const metadata = { title: "Authenticity policy" };

export default function AuthenticityPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Authenticity policy"
      lede="Counterfeit injectables are a patient-safety problem, not a pricing problem. Here’s our guarantee."
    >
      <InfoSection title="Our guarantee">
        <p>
          Every product we sell is 100% authentic, sourced through authorized distribution channels, and
          traceable to its manufacturer batch. We do not purchase from unverified resellers or secondary
          grey markets.
        </p>
      </InfoSection>
      <InfoSection title="Traceability">
        <p>
          Batch and lot numbers are recorded for every unit that enters and leaves our facility, so any
          product can be traced from manufacturer to clinic.
        </p>
      </InfoSection>
      <InfoSection title="If you ever have a doubt">
        <p>
          Send us the batch number and a photo — we’ll verify it against our records and the
          manufacturer’s, and respond within one business day.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
