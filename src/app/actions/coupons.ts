"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { couponDiscount } from "@/lib/coupon-discount";

export type CouponValidation =
  | { ok: true; code: string; kind: "percent" | "fixed"; value: number; discount: number }
  | { ok: false; message: string };

// Runs service-role only — customers never read the coupons table directly,
// so codes/limits can't be enumerated from the browser.
export async function validateCoupon(codeInput: string, subtotal: number): Promise<CouponValidation> {
  const code = codeInput.trim().toUpperCase();
  if (!code) return { ok: false, message: "Enter a coupon code." };

  const admin = createAdminClient();
  const { data: coupon } = await admin
    .from("coupons")
    .select("code, kind, value, min_subtotal, max_uses, used_count, expires_at, is_active")
    .ilike("code", code)
    .maybeSingle();

  if (!coupon || !coupon.is_active) {
    return { ok: false, message: "That coupon code isn't valid." };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { ok: false, message: "That coupon has expired." };
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { ok: false, message: "That coupon has reached its usage limit." };
  }
  if (subtotal < Number(coupon.min_subtotal)) {
    return {
      ok: false,
      message: `That coupon needs a subtotal of at least $${Number(coupon.min_subtotal).toFixed(0)}.`,
    };
  }

  const kind = coupon.kind === "fixed" ? "fixed" : "percent";
  const value = Number(coupon.value);
  return { ok: true, code: coupon.code.toUpperCase(), kind, value, discount: couponDiscount(kind, value, subtotal) };
}

// ── Admin CRUD ──────────────────────────────────────────────────────────────

export type CouponResult = { ok: true; message?: string } | { ok: false; message: string };

export async function createCoupon(input: {
  code: string;
  kind: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  expiresAt: string | null; // yyyy-mm-dd
}): Promise<CouponResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,32}$/.test(code)) {
    return { ok: false, message: "Codes are 3–32 letters, numbers, or dashes." };
  }
  const value = Number(input.value);
  if (!(value > 0) || (input.kind === "percent" && value > 100)) {
    return { ok: false, message: "Enter a valid discount value." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("coupons").insert({
    code,
    kind: input.kind,
    value,
    min_subtotal: Math.max(0, Number(input.minSubtotal) || 0),
    max_uses: input.maxUses === null ? null : Math.max(1, Math.round(input.maxUses)),
    expires_at: input.expiresAt ? new Date(`${input.expiresAt}T23:59:59`).toISOString() : null,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "That code already exists." };
    return { ok: false, message: "Couldn't create the coupon. Please try again." };
  }

  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon ${code} created.` };
}

export async function toggleCoupon(id: string, isActive: boolean): Promise<CouponResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const admin = createAdminClient();
  const { error } = await admin.from("coupons").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, message: "Couldn't update the coupon." };

  revalidatePath("/admin/coupons");
  return { ok: true, message: isActive ? "Coupon activated." : "Coupon deactivated." };
}

export async function deleteCoupon(id: string): Promise<CouponResult> {
  const adminUser = await getAdminUser();
  if (!adminUser) return { ok: false, message: "Admin access required." };

  const admin = createAdminClient();
  const { error } = await admin.from("coupons").delete().eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete the coupon." };

  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon deleted." };
}
