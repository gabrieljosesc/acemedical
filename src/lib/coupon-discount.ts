/** Discount a coupon grants for a given subtotal, capped at the subtotal. */
export function couponDiscount(kind: string, value: number, subtotal: number): number {
  const raw = kind === "percent" ? (subtotal * value) / 100 : value;
  return Math.min(Math.round(raw * 100) / 100, subtotal);
}
