import { InfoPage, InfoSection } from "@/components/info/InfoPage";

export const metadata = { title: "Shipping & cold-chain" };

export default function ShippingPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Shipping & cold-chain"
      lede="Temperature-sensitive products are only as good as the chain that delivers them. Here’s how ours works."
    >
      <InfoSection title="Rates">
        <p>Orders of $500 or more ship free. Orders under $500 ship at a flat $25 insured rate.</p>
      </InfoSection>
      <InfoSection title="Dispatch">
        <p>
          Approved orders are packed and dispatched within 24 hours on business days. You’ll receive an
          email when your order is confirmed and again when it ships.
        </p>
      </InfoSection>
      <InfoSection title="Cold-chain packaging">
        <p>
          Refrigerated products travel in validated insulated packaging with gel packs sized to the route
          and season. Every shipment is insured and tracked door to door.
        </p>
      </InfoSection>
      <InfoSection title="Receiving your order">
        <p>
          Refrigerate cold-chain items immediately on arrival. If a shipment arrives damaged or outside
          temperature range, photograph the packaging and contact us within 24 hours — we’ll replace it.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
