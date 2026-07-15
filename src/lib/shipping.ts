// Matches the site's own "Free shipping on trade orders over $500" messaging.
// The flat under-threshold rate is a reasonable placeholder — adjust once the
// business has real carrier-negotiated rates.
export const FREE_SHIPPING_THRESHOLD = 500;
const FLAT_SHIPPING_RATE = 25;

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
}
