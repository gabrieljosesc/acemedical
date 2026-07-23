// Mirrors peakmedical's shipping policy:
// your first order always ships free; after that, free at $800+,
// $50 on $500-$799.99, $100 under $500.
export const FREE_SHIPPING_THRESHOLD = 800;
export const MID_SHIPPING_THRESHOLD = 500;
export const MID_SHIPPING_RATE = 50;
export const BASE_SHIPPING_RATE = 100;

export const SHIPPING_RATES_TEXT = `Your first order ships free. After that: free on orders of $${FREE_SHIPPING_THRESHOLD}+, $${MID_SHIPPING_RATE} on orders of $${MID_SHIPPING_THRESHOLD}–$${FREE_SHIPPING_THRESHOLD}, $${BASE_SHIPPING_RATE} on orders under $${MID_SHIPPING_THRESHOLD}.`;

export function calculateShipping(subtotal: number, isFirstOrder = false): number {
  if (subtotal <= 0) return 0;
  if (isFirstOrder) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  if (subtotal >= MID_SHIPPING_THRESHOLD) return MID_SHIPPING_RATE;
  return BASE_SHIPPING_RATE;
}
