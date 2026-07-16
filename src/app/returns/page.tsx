import { InfoPage, InfoSection } from "@/components/info/InfoPage";

export const metadata = { title: "Returns & recalls" };

export default function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Returns & recalls"
      lede="Clear rules, fairly applied — with the safety constraints that come with medical products."
    >
      <InfoSection title="Room-temperature products">
        <p>
          Unopened products stored at room temperature can be returned within 14 days of delivery for a
          refund or credit. Contact us first for a return authorization — unauthorized returns can’t be
          accepted.
        </p>
      </InfoSection>
      <InfoSection title="Cold-chain products">
        <p>
          Because temperature integrity can’t be verified after delivery, refrigerated products can’t be
          returned. If a cold-chain shipment arrives damaged, late, or outside range, contact us within 24
          hours with photos and we’ll replace it at no cost.
        </p>
      </InfoSection>
      <InfoSection title="Wrong or damaged items">
        <p>We make it right — replacement or full refund, our choice of remedy, no restocking fees.</p>
      </InfoSection>
      <InfoSection title="Recalls">
        <p>
          Full batch traceability means that if a manufacturer issues a recall, we identify and notify every
          affected customer directly with return instructions and replacement or credit.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
