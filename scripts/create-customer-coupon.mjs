/**
 * One-time 5% "welcome back" coupons for customers who have ordered
 * before — issued one at a time.
 *
 *   node scripts/create-customer-coupon.mjs --list
 *     → shows every customer with at least one order, their order
 *       count, and whether their coupon exists yet.
 *
 *   node scripts/create-customer-coupon.mjs someone@example.com
 *     → creates (or shows, if already created) that customer's code.
 *
 * Codes are derived from the email (ACE5-XXXXXX), so the same customer
 * always gets the same code and re-running is safe. Each code is
 * percent/5 with max_uses=1 — the existing checkout validation
 * enforces the single use. Issued codes are appended to
 * scripts/customer-coupons.local.csv (gitignored) for your records.
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

const LOG_PATH = path.join(__dirname, "customer-coupons.local.csv");

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Deterministic, unguessable-enough code per email: ACE5-XXXXXX
function codeForEmail(email) {
  const hash = crypto.createHash("sha256").update("ace5:" + email.toLowerCase().trim()).digest();
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[hash[i] % alphabet.length];
  return "ACE5-" + out;
}

async function fetchAllOrders() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("orders")
      .select("customer_email, status")
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function customersWithOrders() {
  const orders = await fetchAllOrders();
  const counts = new Map();
  for (const o of orders) {
    const email = o.customer_email?.toLowerCase().trim();
    if (!email || o.status === "cancelled") continue;
    counts.set(email, (counts.get(email) ?? 0) + 1);
  }
  return counts;
}

function logIssued(email, code) {
  if (!fs.existsSync(LOG_PATH)) fs.writeFileSync(LOG_PATH, "email,code,issued_at\n");
  fs.appendFileSync(LOG_PATH, `${email},${code},${new Date().toISOString()}\n`);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.log("Usage:\n  node scripts/create-customer-coupon.mjs --list\n  node scripts/create-customer-coupon.mjs someone@example.com");
    process.exit(1);
  }

  const counts = await customersWithOrders();

  if (arg === "--list") {
    const { data: coupons } = await admin.from("coupons").select("code");
    const existing = new Set((coupons ?? []).map((c) => c.code.toUpperCase()));
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    console.log(`${sorted.length} customers with orders:\n`);
    for (const [email, n] of sorted) {
      const code = codeForEmail(email);
      console.log(`  ${existing.has(code) ? "✓ " + code : "· (not issued)"}  ${email}  (${n} order${n === 1 ? "" : "s"})`);
    }
    return;
  }

  const email = arg.toLowerCase().trim();
  if (!counts.has(email)) {
    console.error(`${email} has no (non-cancelled) orders — no coupon issued.`);
    console.error("Use --list to see eligible customers.");
    process.exit(1);
  }

  const code = codeForEmail(email);
  const { data: existing } = await admin.from("coupons").select("code, used_count, is_active").ilike("code", code).maybeSingle();
  if (existing) {
    console.log(`Already issued: ${existing.code} (used ${existing.used_count}/1, ${existing.is_active ? "active" : "inactive"}) — ${email}`);
    return;
  }

  const { error } = await admin.from("coupons").insert({
    code,
    kind: "percent",
    value: 5,
    min_subtotal: 0,
    max_uses: 1,
    is_active: true,
  });
  if (error) throw error;

  logIssued(email, code);
  console.log(`Created one-time 5% coupon for ${email}:\n\n  ${code}\n\nLogged to scripts/customer-coupons.local.csv`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
