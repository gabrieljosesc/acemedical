import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returning-customer thank-you: customers migrated from the old site
 * (orders with WP-… reference numbers) automatically get 5% off their
 * first order on the new site. Applied and revalidated server-side;
 * recorded on the order as coupon_code WELCOME5, which is also what
 * makes it one-time.
 */
export const WELCOME_BACK_CODE = "WELCOME5";
export const WELCOME_BACK_PERCENT = 5;

export async function isWelcomeBackEligible(
  admin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { count: oldSiteOrders } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("reference_number", "WP-%");
  if (!oldSiteOrders) return false;

  const { count: alreadyUsed } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("coupon_code", WELCOME_BACK_CODE)
    .neq("status", "cancelled");
  return !alreadyUsed;
}
