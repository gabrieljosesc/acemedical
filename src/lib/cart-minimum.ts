/** Wholesale minimum: orders below this subtotal (after volume pricing,
 *  before shipping) can't be checked out. Enforced in the cart UI, the
 *  checkout form, and re-validated server-side in placeOrder. */
export const MIN_CHECKOUT_SUBTOTAL_USD = 300;

export function meetsCheckoutMinimumUsd(subtotal: number): boolean {
  return subtotal >= MIN_CHECKOUT_SUBTOTAL_USD;
}
