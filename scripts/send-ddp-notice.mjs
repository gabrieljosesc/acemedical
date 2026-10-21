/**
 * Sends the "Important update regarding upcoming shipments" (DDP/duties)
 * notice to every registered user in the database, skipping test accounts.
 *
 * Each message is sent through the site's own SMTP server AND the exact
 * same raw message is appended to the mailbox's Sent folder over IMAP,
 * so every email shows up in Sent for info@acemedicalwholesale.com.
 *
 *   node scripts/send-ddp-notice.mjs                 → list targets only (no emails)
 *   node scripts/send-ddp-notice.mjs --only=a@b.com  → send ONE test email
 *   node scripts/send-ddp-notice.mjs --send          → send to all targets
 *
 * Other flags: --limit=N  --offset=N  --delay=ms (default 400)
 *
 * Requires SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in .env.local.
 * IMAP defaults to the same host/credentials on port 993 (override with
 * IMAP_HOST / IMAP_PORT if the mail server uses a different one).
 * Needs `imapflow` available (npm i imapflow --no-save).
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
const DELAY = parseInt(args.delay ?? "400", 10);

const SUBJECT = "Important update regarding upcoming shipments";
const FROM_NAME = "Ace Medical Wholesale";
const FROM_ADDR = "info@acemedicalwholesale.com";

const TEAL = "#0C5B50";
const INK = "#10231E";
const P = `style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#4B5A53;margin:0 0 12px"`;
const H = `style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:${INK};font-weight:bold;margin:18px 0 6px"`;

// Same branded shell as the password-reset email.
const EMAIL_HTML = `
  <div style="font-family:Georgia,serif;background:#F2F4EF;padding:32px 16px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #DAE0D6;border-radius:4px;overflow:hidden">
      <div style="background:${TEAL};padding:18px 24px">
        <span style="color:#F4FBF8;font-size:19px;font-weight:600">Ace<span style="opacity:.75">Medical</span></span>
        <span style="color:#8FD3C5;font-size:10px;letter-spacing:2px;margin-left:8px">WHOLESALE</span>
      </div>
      <div style="padding:26px 24px;color:${INK}">
        <h1 style="font-size:20px;margin:0 0 14px">Important update regarding upcoming shipments</h1>
        <p ${P}>Dear Valued Customer,</p>
        <p ${P}>We want to share an important update that may affect your shipments going forward.</p>
        <p ${P}>Effective at the end of this month, most major courier companies are expected to
        discontinue the Delivered Duty Paid (DDP) shipping option for U.S.-bound deliveries.
        Until now, we have prepaid all duties and customs clearance on your shipments in advance.
        With this policy change, carriers may no longer allow us to continue that process in the
        same way.</p>
        <p ${H}>What this means for you</p>
        <p ${P}>Our logistics team is already putting solutions in place to keep your delivery
        experience as seamless as possible. Our priority remains to handle all applicable duties
        and taxes on your behalf so you don&rsquo;t have to.</p>
        <p ${P}>However, due to these changes, there may be rare cases where the courier asks you
        to pay duties, taxes, or local charges before a shipment can be released or delivered.</p>
        <p ${H}>Our commitment to you</p>
        <p ${P}>We are managing the back-end logistics so that you have zero out-of-pocket costs
        or, at most, a minimal amount.</p>
        <p ${P}><strong>Full reimbursement:</strong> If you are required to pay any upfront
        delivery fees or duties to release your shipment, we will fully reimburse you. Simply
        forward the receipt to our team and we will process your reimbursement promptly.</p>
        <p ${P}>We value your trust and are committed to minimizing any disruption to your
        deliveries. If you have any questions about this transition, please don&rsquo;t hesitate
        to reach out.</p>
        <p ${P}>We look forward to continuing to work with you, and thank you for your loyalty as
        a valued client.</p>
        <p ${P} style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#4B5A53;margin:18px 0 0">
          Regards,<br>
          <strong style="color:${INK}">Ace Medical Wholesale</strong><br>
          &#128231; <a href="mailto:info@acemedicalwholesale.com" style="color:${TEAL}">info@acemedicalwholesale.com</a><br>
          &#128222; 1-800-465-1525<br>
          &#127760; <a href="https://acemedicalwholesale.com" style="color:${TEAL}">acemedicalwholesale.com</a>
        </p>
      </div>
      <div style="padding:14px 24px;border-top:1px solid #DAE0D6;color:#79877E;font-size:12px;font-family:Arial,sans-serif">
        Ace Medical Wholesale · info@acemedicalwholesale.com · 1-800-465-1525
      </div>
    </div>
  </div>`;

const EMAIL_TEXT = `Dear Valued Customer,

We want to share an important update that may affect your shipments going forward.

Effective at the end of this month, most major courier companies are expected to discontinue the Delivered Duty Paid (DDP) shipping option for U.S.-bound deliveries. Until now, we have prepaid all duties and customs clearance on your shipments in advance. With this policy change, carriers may no longer allow us to continue that process in the same way.

What this means for you
Our logistics team is already putting solutions in place to keep your delivery experience as seamless as possible. Our priority remains to handle all applicable duties and taxes on your behalf so you don't have to.

However, due to these changes, there may be rare cases where the courier asks you to pay duties, taxes, or local charges before a shipment can be released or delivered.

Our commitment to you
We are managing the back-end logistics so that you have zero out-of-pocket costs or, at most, a minimal amount.

Full reimbursement: If you are required to pay any upfront delivery fees or duties to release your shipment, we will fully reimburse you. Simply forward the receipt to our team and we will process your reimbursement promptly.

We value your trust and are committed to minimizing any disruption to your deliveries. If you have any questions about this transition, please don't hesitate to reach out.

We look forward to continuing to work with you, and thank you for your loyalty as a valued client.

Regards,
Ace Medical Wholesale
info@acemedicalwholesale.com
1-800-465-1525
https://acemedicalwholesale.com`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

function classify(users) {
  const targets = [];
  const skipped = []; // { email, reason }
  const seen = new Set();
  for (const u of users) {
    const email = (u.email ?? "").toLowerCase().trim();
    if (!email) { skipped.push({ email: `(no email, id ${u.id})`, reason: "no email address" }); continue; }
    if (seen.has(email)) { skipped.push({ email, reason: "duplicate" }); continue; }
    seen.add(email);
    if (email.includes("test")) { skipped.push({ email, reason: "test account" }); continue; }
    if (email === FROM_ADDR) { skipped.push({ email, reason: "sender mailbox itself" }); continue; }
    if (!EMAIL_RE.test(email) || email.endsWith(".invalid")) { skipped.push({ email, reason: "invalid address" }); continue; }
    targets.push(email);
  }
  targets.sort();
  return { targets, skipped };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Missing Supabase env vars in .env.local"); process.exit(1); }
  if (!process.env.SMTP_HOST?.trim() || !process.env.SMTP_USER?.trim() || !process.env.SMTP_PASS?.trim()) {
    console.error("Missing SMTP_HOST / SMTP_USER / SMTP_PASS in .env.local");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  console.log("Loading users…");
  const users = await fetchAllAuthUsers(admin);
  let { targets, skipped } = classify(users);

  if (ONLY) targets = targets.filter((e) => e === ONLY);
  else targets = targets.slice(OFFSET, OFFSET + LIMIT);

  console.log(`Users in database: ${users.length}`);
  console.log(`Targets: ${targets.length}   Skipped: ${skipped.length}`);
  for (const s of skipped) console.log(`  SKIP (${s.reason}): ${s.email}`);

  if (!SEND && !ONLY) {
    console.log("");
    for (const e of targets) console.log(`  would email: ${e}`);
    console.log("\nListing only. Re-run with --send (or --only=email@x.com) to actually email.");
    return;
  }
  if (ONLY && targets.length === 0) { console.error(`No account found for --only=${ONLY}`); process.exit(1); }

  // --- SMTP transport ---
  const { default: nodemailer } = await import("nodemailer");
  const { default: MailComposer } = await import("nodemailer/lib/mail-composer/index.js");
  const smtpHost = process.env.SMTP_HOST.trim();
  const smtpPort = Number(process.env.SMTP_PORT ?? 465);
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: process.env.SMTP_USER.trim(), pass: process.env.SMTP_PASS },
  });
  console.log(`\nTransport: SMTP (${smtpHost}:${smtpPort})`);

  // --- IMAP connection for the Sent-folder copies ---
  const { ImapFlow } = await import("imapflow");
  const imapHost = process.env.IMAP_HOST?.trim() || smtpHost;
  const imapPort = Number(process.env.IMAP_PORT ?? 993);
  const imap = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: { user: process.env.SMTP_USER.trim(), pass: process.env.SMTP_PASS },
    logger: false,
  });
  let sentPath = null;
  try {
    await imap.connect();
    const boxes = await imap.list();
    const sentBox =
      boxes.find((b) => b.specialUse === "\\Sent") ??
      boxes.find((b) => /(^|[./])sent/i.test(b.path));
    if (sentBox) {
      sentPath = sentBox.path;
      console.log(`IMAP: connected (${imapHost}:${imapPort}), Sent folder = "${sentPath}"`);
    } else {
      console.warn(`IMAP: connected but no Sent folder found — mailboxes: ${boxes.map((b) => b.path).join(", ")}`);
    }
  } catch (e) {
    console.warn(`IMAP: could not connect (${e.message}) — emails will still send, but no Sent copies.`);
  }

  let sent = 0, failed = 0, appendFailed = 0;
  const failures = [];
  for (const to of targets) {
    try {
      const composer = new MailComposer({
        from: `"${FROM_NAME}" <${FROM_ADDR}>`,
        to,
        subject: SUBJECT,
        html: EMAIL_HTML,
        text: EMAIL_TEXT,
      });
      const raw = await composer.compile().build();
      await transporter.sendMail({ envelope: { from: FROM_ADDR, to: [to] }, raw });
      sent++;
      let tag = "SENT";
      if (sentPath) {
        try {
          await imap.append(sentPath, raw, ["\\Seen"], new Date());
        } catch (e) {
          appendFailed++;
          tag = "SENT (Sent-copy failed)";
        }
      }
      console.log(`  ${tag}: ${to}`);
    } catch (e) {
      failed++;
      failures.push({ email: to, error: e.message });
      console.error(`  FAIL: ${to} — ${e.message}`);
    }
    await sleep(DELAY);
  }

  try { await imap.logout(); } catch { /* already closed */ }

  console.log(`\nDone. sent=${sent} failed=${failed} skipped=${skipped.length} sent-copy-failures=${appendFailed}`);
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log(`  ${f.email}: ${f.error}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
