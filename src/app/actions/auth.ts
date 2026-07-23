"use server";

import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { registerSchema, flattenErrors, type RegisterInput } from "@/lib/validation/register-schema";
import { sendVerifyEmail, sendPasswordResetEmail } from "@/lib/email/auth-emails";

/**
 * Base URL for links we email (verify, password reset). Prefers the
 * configured canonical domain, but falls back to the incoming request's
 * origin so links never point at localhost on a deploy where the env var
 * was never set.
 */
async function resolveSiteUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (env && !/localhost|127\.0\.0\.1/.test(env)) return env;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return env || "http://localhost:3000";
}

export type RegisterResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string>; message?: undefined }
  | { ok: false; message: string; fieldErrors?: undefined };

/**
 * Creates the account and emails a verification link via our own transport
 * (SMTP, falling back to Resend) instead of Supabase's built-in mailer,
 * which is rate-limited (~2/hour) and unreliable for a fresh signup burst.
 * The `on_auth_user_created` trigger populates the profile row from the
 * metadata passed here.
 */
export async function registerAction(raw: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error) };
  }
  const v = parsed.data;
  const siteUrl = await resolveSiteUrl();

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: v.email,
    password: v.password,
    options: {
      data: {
        prefix: v.prefix,
        first_name: v.firstName,
        middle_name: v.middleName,
        last_name: v.lastName,
        phone: v.phone,
        address_line1: v.addressLine1,
        city: v.city,
        state: v.state,
        postal_code: v.postalCode,
        country: v.country,
        company: v.company,
        business_phone: v.businessPhone,
        specialty: v.specialty,
        website: v.website,
        license_holder_name: v.licenseHolderName,
        profession: v.profession,
        license_number: v.licenseNumber,
        license_expiry: v.licenseExpiry,
        license_state: v.licenseState,
        license_country: v.licenseCountry,
      },
    },
  });

  if (error) {
    if (/already.*registered|already.*exists/i.test(error.message ?? "")) {
      return { ok: false, fieldErrors: { email: "An account with this email already exists." } };
    }
    return { ok: false, message: error.message };
  }

  const confirmUrl =
    `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(data.properties?.hashed_token ?? "")}` +
    `&type=signup&next=${encodeURIComponent("/")}`;

  const sent = await sendVerifyEmail(v.email, confirmUrl);
  if (!sent.ok) {
    console.error("[registerAction] verify email failed:", sent.error);
    // Last resort: Supabase's built-in mailer (rate-limited, but better than nothing).
    const anon = await createClient();
    await anon.auth.resend({
      type: "signup",
      email: v.email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/` },
    });
  }

  return { ok: true };
}

export type ForgotPasswordResult = { sent: true };

/**
 * Emails a password-reset link via our own transport, bypassing Supabase's
 * built-in mailer. Always reports success — never reveals whether the
 * address is registered.
 */
export async function forgotPasswordAction(email: string): Promise<ForgotPasswordResult> {
  const trimmed = email.trim();
  if (!trimmed) return { sent: true };

  const siteUrl = await resolveSiteUrl();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: trimmed });

  if (error || !data.properties?.hashed_token) {
    if (error) console.error("[forgotPasswordAction] generateLink:", error.message);
    return { sent: true };
  }

  const resetUrl =
    `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
    `&type=recovery&next=${encodeURIComponent("/auth/update-password")}`;

  const sent = await sendPasswordResetEmail(trimmed, resetUrl);
  if (!sent.ok) {
    console.error("[forgotPasswordAction] reset email failed:", sent.error);
    const anon = await createClient();
    await anon.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
    });
  }
  return { sent: true };
}
