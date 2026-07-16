export type PriceTier = { minQ: number; maxQ: number; price: number };

export function parsePriceTiers(raw: unknown): PriceTier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is PriceTier =>
        !!t &&
        typeof t === "object" &&
        Number.isFinite(Number((t as PriceTier).minQ)) &&
        Number.isFinite(Number((t as PriceTier).maxQ)) &&
        Number.isFinite(Number((t as PriceTier).price))
    )
    .map((t) => ({ minQ: Number(t.minQ), maxQ: Number(t.maxQ), price: Number(t.price) }))
    .sort((a, b) => a.minQ - b.minQ);
}

/** Unit price for a quantity: the matching tier's price, else the base price. */
export function unitPriceForQuantity(tiers: PriceTier[], quantity: number, basePrice: number): number {
  const tier = tiers.find((t) => quantity >= t.minQ && quantity <= t.maxQ);
  return tier ? tier.price : basePrice;
}

/** "1–3", "21+" (open-ended tiers use a large maxQ). */
export function tierQuantityLabel(tier: PriceTier): string {
  if (tier.maxQ >= 1000) return `${tier.minQ}+`;
  if (tier.minQ === tier.maxQ) return String(tier.minQ);
  return `${tier.minQ}–${tier.maxQ}`;
}
