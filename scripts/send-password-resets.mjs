/**
 * Emails migrated customers a branded "set your password" link so they
 * can sign in to the new site (their accounts have no password yet).
 *
 * Mirrors the site's own forgot-password flow: an admin recovery link
 * (auth/confirm?token_hash=…) wrapped in the Ace Medical email shell,
 * sent through the same SMTP server (or Resend) the site uses — NOT
 * Supabase's rate-limited built-in mailer.
 *
 * By default only targets ACTIVE customers: migrated users with at
 * least one order. Nothing is sent without an explicit flag:
 *
 *   node scripts/send-password-resets.mjs                      → list targets only (no emails)
 *   node scripts/send-password-resets.mjs --only=a@b.com       → send ONE test email
 *   node scripts/send-password-resets.mjs --send               → send to all targets
 *   node scripts/send-password-resets.mjs --send --limit=50    → batch send
 *
 * Other flags: --offset=N  --delay=ms (default 1200)  --site=https://…
 *              --all-migrated (include migrated users with no orders)
 *
 * Requires SMTP_HOST/SMTP_USER/SMTP_PASS (or RESEND_API_KEY) in
 * .env.local — copy them from the Vercel project env before running.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.slice(2).split("=");
    return [k, v ?? true];
  })
);

const SEND = args.send === true;
const ONLY = (typeof args.only === "string" ? args.only : "").toLowerCase().trim();
const LIMIT = parseInt(args.limit ?? "9999", 10);
const OFFSET = parseInt(args.offset ?? "0", 10);
const DELAY = parseInt(args.delay ?? "1200", 10);
const ALL_MIGRATED = args["all-migrated"] === true;

const envSite = process.env.NEXT_PUBLIC_SITE_URL;
const SITE_URL =
  (typeof args.site === "string" && args.site) ||
  (envSite && !envSite.includes("localhost") ? envSite : null) ||
  "https://acemedicalwholesale.com";

const TEAL = "#0C5B50";
const INK = "#10231E";
const P = `style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#4B5A53;margin:0 0 12px"`;

// Same shell as src/lib/email/auth-emails.ts, with migration-specific copy.
function resetEmailHtml(resetUrl) {
  return `
  <div style="font-family:Georgia,serif;background:#F2F4EF;padding:32px 16px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #DAE0D6;border-radius:4px;overflow:hidden">
      <div style="background:${TEAL};padding:18px 24px">
        <span style="color:#F4FBF8;font-size:19px;font-weight:600">Ace<span style="opacity:.75">Medical</span></span>
        <span style="color:#8FD3C5;font-size:10px;letter-spacing:2px;margin-left:8px">WHOLESALE</span>
      </div>
      <div style="padding:26px 24px;color:${INK}">
        <h1 style="font-size:20px;margin:0 0 12px">Your account is ready — set your password</h1>
        <p ${P}>Welcome to the new Ace Medical Wholesale. Your account and full order
        history have already been moved over for you.</p>
        <p ${P}>For security, your old password was not carried across. Click the button
        below to set a new one and sign in.</p>
        <p ${P}>As a thank-you for coming back: a one-time <strong>5% discount</strong> is
        applied automatically at checkout on your next order.</p>
        <p style="margin:20px 0">
          <a href="${resetUrl}" style="display:inline-block;background:${TEAL};color:#F4FBF8;text-decoration:none;font-weight:bold;font-family:Arial,sans-serif;font-size:14px;padding:12px 28px;border-radius:2px">Set My Password</a>
        </p>
        <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#79877E;word-break:break-all">
          Or copy this link into your browser:<br>${resetUrl}
        </p>
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#9CA79E;margin:24px 0 0">
          If you did not expect this email, you can safely ignore it.
        </p>
      </div>
      <div style="padding:14px 24px;border-top:1px solid #DAE0D6;color:#79877E;font-size:12px;font-family:Arial,sans-serif">
        Ace Medical Wholesale · info@acemedicalwholesale.com · 1-800-465-1525
      </div>
    </div>
  </div>`;
}

function resetEmailText(resetUrl) {
  return `Welcome to the new Ace Medical Wholesale.

Your account and order history have been moved over. For security, your old password was not carried across — set a new one here:

${resetUrl}

As a thank-you for coming back, a one-time 5% discount is applied automatically at checkout on your next order.

If you did not expect this email, you can safely ignore it.`;
}

const SUBJECT = "Set your password — your Ace Medical Wholesale account is ready";

async function makeSender() {
  if (process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()) {
    const { default: nodemailer } = await import("nodemailer");
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST.trim(),
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER.trim(), pass: process.env.SMTP_PASS },
    });
    const from = process.env.EMAIL_FROM || "Ace Medical Wholesale <info@acemedicalwholesale.com>";
    console.log(`Transport: SMTP (${process.env.SMTP_HOST.trim()}:${port})`);
    return async (to, resetUrl) => {
      await transporter.sendMail({ from, to, subject: SUBJECT, html: resetEmailHtml(resetUrl), text: resetEmailText(resetUrl) });
    };
  }
  if (process.env.RESEND_API_KEY?.trim()) {
    const from = process.env.EMAIL_FROM || "Ace Medical Wholesale <info@acemedicalwholesale.com>";
    console.log("Transport: Resend API");
    return async (to, resetUrl) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject: SUBJECT, html: resetEmailHtml(resetUrl), text: resetEmailText(resetUrl) }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    };
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchAllAuthUsers(client) {
  const all = [];
  let page = 1;
  for (;;) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    all.push(...(data.users ?? []));
    if (!data.nextPage) break;
    page++;
  }
  return all;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env vars in .env.local");
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });

  console.log("Loading users and orders…");
  const users = await fetchAllAuthUsers(admin);

  // Emails of everyone who has ever placed an order (active customers)
  const customerEmails = new Set();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from("orders").select("customer_email").range(from, from + 999);
    if (error) throw error;
    for (const o of data ?? []) if (o.customer_email) customerEmails.add(o.customer_email.toLowerCase());
    if (!data || data.length < 1000) break;
  }

  const migrated = users.filter((u) => u.email && u.user_metadata?.migrated === true);
  let targets = ONLY
    ? users.filter((u) => u.email?.toLowerCase() === ONLY)
    : migrated
        .filter((u) => ALL_MIGRATED || customerEmails.has(u.email.toLowerCase()))
        .sort((a, b) => a.email.localeCompare(b.email))
        .slice(OFFSET, OFFSET + LIMIT);

  console.log(`Users: total=${users.length} migrated=${migrated.length} with-orders=${migrated.filter((u) => customerEmails.has(u.email.toLowerCase())).length}`);
  console.log(`Targets (offset=${OFFSET}, limit=${LIMIT}${ONLY ? `, only=${ONLY}` : ""}${ALL_MIGRATED ? ", all-migrated" : ", customers-only"}): ${targets.length}`);
  console.log(`Reset links point to: ${SITE_URL}\n`);

  if (ONLY && targets.length === 0) {
    console.error(`No account found for --only=${ONLY}.`);
    process.exit(1);
  }

  if (!SEND && !ONLY) {
    for (const u of targets.slice(0, 30)) console.log(`  would email: ${u.email}`);
    if (targets.length > 30) console.log(`  … and ${targets.length - 30} more`);
    console.log("\nListing only. Re-run with --send (or --only=email@x.com for one test) to actually email.");
    return;
  }

  const send = await makeSender();
  if (!send) {
    console.error(
      "No email transport configured. Add SMTP_HOST / SMTP_USER / SMTP_PASS (or RESEND_API_KEY)\n" +
      "to .env.local — same values as the Vercel project env — and re-run."
    );
    process.exit(1);
  }

  let sent = 0, failed = 0;
  for (const user of targets) {
    try {
      const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: user.email });
      if (error || !data.properties?.hashed_token) throw new Error(error?.message ?? "no token");
      const resetUrl =
        `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
        `&type=recovery&next=${encodeURIComponent("/auth/update-password")}`;
      await send(user.email, resetUrl);
      console.log(`  SENT: ${user.email}`);
      sent++;
    } catch (e) {
      console.error(`  FAIL: ${user.email} — ${e.message}`);
      failed++;
    }
    await sleep(DELAY);
  }

  console.log(`\nDone. sent=${sent} failed=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
