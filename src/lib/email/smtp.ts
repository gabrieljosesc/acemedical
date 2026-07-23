import "server-only";
import nodemailer from "nodemailer";
import type { SendEmailInput, SendEmailResult } from "./resend";

const FROM = process.env.EMAIL_FROM || "Ace Medical Wholesale <info@acemedicalwholesale.com>";

export function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
  );
}

/** Sends via the site's own mail server — the same one behind the info@ mailbox. */
export async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT ?? 465);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error("[email] SMTP error:", err);
    return { ok: false, error: String(err) };
  }
}
