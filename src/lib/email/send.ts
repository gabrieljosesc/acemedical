import "server-only";
import { sendTransactionalEmail as sendViaResend, type SendEmailInput, type SendEmailResult } from "./resend";
import { sendViaSmtp, smtpConfigured } from "./smtp";

/**
 * Unified transactional email sender.
 *
 * Transport priority:
 *  1. Own mail server via SMTP (SMTP_HOST / SMTP_USER / SMTP_PASS) — the
 *     same server behind info@acemedicalwholesale.com in webmail.
 *  2. Resend (RESEND_API_KEY) as fallback.
 *  3. Neither configured → logs and no-ops, so order placement never breaks.
 */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (smtpConfigured()) {
    return sendViaSmtp(input);
  }
  return sendViaResend(input);
}

export type { SendEmailInput, SendEmailResult };

export function adminRecipients(): string[] {
  const extra = (process.env.ADMIN_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const primary = process.env.NOTIFICATION_EMAIL?.trim();
  return [...(primary ? [primary] : []), ...extra];
}
