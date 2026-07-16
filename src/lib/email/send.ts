// Transactional email transport. Uses Resend's HTTPS API when
// RESEND_API_KEY is set; otherwise logs and no-ops so order placement
// and admin actions never fail because email isn't configured yet.

const FROM = process.env.EMAIL_FROM || "Ace Medical Wholesale <orders@acemedicalwholesale.com>";

export function adminRecipients(): string[] {
  const extra = (process.env.ADMIN_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const primary = process.env.NOTIFICATION_EMAIL?.trim();
  return [...(primary ? [primary] : []), ...extra];
}

export async function sendTransactionalEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ ok: boolean }> {
  const to = Array.isArray(input.to) ? input.to : [input.to];
  if (to.length === 0) return { ok: false };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email skipped — no RESEND_API_KEY] to=${to.join(",")} subject="${input.subject}"`);
    return { ok: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      console.error("[email failed]", res.status, await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email failed]", err);
    return { ok: false };
  }
}
