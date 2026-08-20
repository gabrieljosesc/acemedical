/**
 * Old acemedicalwholesale.com (WordPress/WooCommerce) → new site
 * migration: users, order history, and profile backfill.
 *
 * Consumes the raw exports from the old site's database:
 *   wp_users (1).csv                 registered accounts
 *   order_billing.csv                per-order billing identity (from the
 *                                    wp_postmeta SQL export) — attributes
 *                                    orders to people
 *   wp_wc_order_stats.csv            one row per order (totals, status, date)
 *   wp_wc_order_product_lookup.csv   line items (product_id, qty, revenue)
 *   scripts/old-shop-products.json   product_id → product name (harvested
 *                                    from the old shop's public API)
 *
 * NOTE: the old site's automatic personal-data cleanup anonymized most
 * historical orders in the source database ("deleted@site.invalid").
 * Those orders cannot be attributed to anyone and are SKIPPED by
 * default — pass --include-anonymized to import them anyway as
 * customer-less records.
 *
 * Steps:
 *  1. Creates an auth account per registered old-site user
 *     (email_confirm=true, NO password, user_metadata.migrated=true) —
 *     nobody is emailed. Idempotent: existing emails are reused.
 *  2. Backfills real names / phone / company / address onto migrated
 *     accounts from their most recent order's billing details.
 *  3. Creates orders as "WP-<order_id>" with original dates, totals,
 *     statuses, addresses, and line items (real product names where
 *     known). Idempotent by reference_number.
 *
 * Usage (from the repo root):
 *   node scripts/migrate-old-site.mjs --dry-run
 *   node scripts/migrate-old-site.mjs
 * Flags: --users-only  --include-anonymized  --dir="D:\some\folder"
 *
 * Afterwards: node scripts/send-password-resets.mjs (separate,
 * deliberate step — that one DOES email people).
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

const DRY_RUN = process.argv.includes("--dry-run");
const USERS_ONLY = process.argv.includes("--users-only");
const INCLUDE_ANONYMIZED = process.argv.includes("--include-anonymized");
const dirArg = process.argv.find((a) => a.startsWith("--dir="));
const DATA_DIR = dirArg ? dirArg.slice(6) : "C:\\Users\\63950\\Downloads";

const USERS_CSV = path.join(DATA_DIR, "wp_users (1).csv");
const BILLING_CSV = path.join(DATA_DIR, "order_billing.csv");
const STATS_CSV = path.join(DATA_DIR, "wp_wc_order_stats.csv");
const ITEMS_CSV = path.join(DATA_DIR, "wp_wc_order_product_lookup.csv");
const PRODUCTS_JSON = path.join(__dirname, "old-shop-products.json");

// Old-site admin / developer accounts — never migrated as customers.
const SKIP_EMAIL = (email) =>
  email.endsWith("@forga.io") ||
  ["info@acemedicalwholesale.com", "admin@acemedical.com"].includes(email);

const ANON = (v) => !v || v === "[deleted]" || v === "deleted@site.invalid" || v === "0000000000";

// WooCommerce status → ace status (pending | confirmed | shipped | cancelled)
function mapStatus(s) {
  return (
    {
      "wc-completed": "confirmed",
      "wc-processing": "pending",
      "wc-on-hold": "pending",
      "wc-pending": "pending",
      "wc-failed": "cancelled",
      "wc-cancelled": "cancelled",
      "wc-refunded": "cancelled",
    }[s] ?? "pending"
  );
}

function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter((l) => l.trim());
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((l) => {
    const vals = parseLine(l);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] === undefined || vals[i] === "NULL" ? null : vals[i]]));
  });
}

function parseLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (c === "," && !q) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

const toIso = (mysqlDate) => (mysqlDate ? mysqlDate.replace(" ", "T") + "Z" : undefined);
const clean = (v) => (ANON(v) ? null : v.trim() || null);
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
  console.log(DRY_RUN ? "── DRY RUN — no writes ──" : "── LIVE RUN ──");

  for (const f of [USERS_CSV, BILLING_CSV, STATS_CSV, ITEMS_CSV, PRODUCTS_JSON]) {
    if (!fs.existsSync(f)) {
      console.error("File not found:", f);
      process.exit(1);
    }
  }

  const target = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log("Reading exports…");
  const wpUsers = parseCSV(USERS_CSV);
  const billing = parseCSV(BILLING_CSV);
  const stats = parseCSV(STATS_CSV).filter((s) => s.parent_id === "0");
  const items = parseCSV(ITEMS_CSV);
  const productNames = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));

  const billingByOrderId = new Map(billing.map((b) => [b.order_id, b]));
  const statById = new Map(stats.map((s) => [s.order_id, s]));
  const attributable = billing.filter((b) => !ANON(b.billing_email));
  console.log(
    `  users=${wpUsers.length} orders=${stats.length} (attributable=${attributable.length}, anonymized=${billing.length - attributable.length}) items=${items.length}`
  );

  // Latest attributable order per email → richest identity source
  const latestBillingByEmail = new Map();
  for (const b of attributable) {
    const email = b.billing_email.toLowerCase().trim();
    const date = statById.get(b.order_id)?.date_created_gmt ?? "";
    const prev = latestBillingByEmail.get(email);
    if (!prev || date > prev.date) latestBillingByEmail.set(email, { ...b, date });
  }

  const existing = await fetchAllAuthUsers(target);
  const emailToAceUser = new Map(existing.map((u) => [u.email?.toLowerCase(), u]));
  const { data: existingOrders } = await target.from("orders").select("reference_number").range(0, 49999);
  const existingRefs = new Set((existingOrders ?? []).map((o) => o.reference_number));
  console.log(`  existing ace users=${existing.length} orders=${existingRefs.size}`);

  // ── Step 1: users ────────────────────────────────────────────────
  console.log("\n--- Users ---");
  let created = 0, existed = 0, skipped = 0, failed = 0;

  for (const u of wpUsers) {
    const email = (u.user_email ?? "").toLowerCase().trim();
    if (!email || SKIP_EMAIL(email)) {
      skipped++;
      continue;
    }
    if (emailToAceUser.has(email)) {
      existed++;
      continue;
    }

    if (DRY_RUN) {
      created++;
      continue;
    }

    const { data, error } = await target.auth.admin.createUser({
      email,
      email_confirm: true, // verified on the old site; no email is sent
      user_metadata: { migrated: true, migrated_from: "acemedicalwholesale-wp", wp_user_id: u.ID },
    });
    if (error) {
      console.error(`  FAIL: ${email} — ${error.message}`);
      failed++;
      await sleep(500);
      continue;
    }
    emailToAceUser.set(email, data.user);
    created++;
    if (created % 100 === 0) console.log(`  …${created} users created`);
    await sleep(60);
  }
  console.log(`Users: created=${created} existed=${existed} skipped=${skipped} failed=${failed}`);

  // ── Step 1b: backfill identity from billing details ──────────────
  console.log("\n--- Profile backfill (from most recent order billing) ---");
  let backfilled = 0;
  for (const [email, b] of latestBillingByEmail) {
    const aceUser = emailToAceUser.get(email);
    if (!aceUser || aceUser.user_metadata?.migrated !== true) continue;

    const fields = {
      first_name: clean(b.first_name),
      last_name: clean(b.last_name),
      company: clean(b.company),
      phone: clean(b.phone),
      address_line1: clean(b.address_1),
      city: clean(b.city),
      state: clean(b.state),
      postal_code: clean(b.zip),
      country: clean(b.country),
    };
    for (const k of Object.keys(fields)) if (fields[k] === null) delete fields[k];
    if (Object.keys(fields).length === 0) continue;

    if (DRY_RUN) {
      backfilled++;
      if (backfilled <= 5) console.log(`  WOULD BACKFILL: ${email} → ${JSON.stringify(fields)}`);
      continue;
    }

    await target.auth.admin.updateUserById(aceUser.id, {
      user_metadata: { ...aceUser.user_metadata, ...fields },
    });
    const { error: pErr } = await target.from("profiles").update(fields).eq("id", aceUser.id);
    if (pErr) console.error(`  PROFILE FAIL: ${email} — ${pErr.message}`);
    else backfilled++;
    await sleep(40);
  }
  console.log(`Profiles backfilled: ${backfilled}`);

  if (USERS_ONLY) {
    console.log("\n--users-only: skipping orders.");
    return;
  }

  // ── Step 2: orders ───────────────────────────────────────────────
  console.log("\n--- Orders ---");
  const itemsByOrder = new Map();
  for (const it of items) {
    if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
    itemsByOrder.get(it.order_id).push(it);
  }

  let ordersOk = 0, ordersExist = 0, ordersFail = 0, ordersAnonSkipped = 0, itemsOk = 0;

  for (const o of stats) {
    const refNum = `WP-${o.order_id}`;
    if (existingRefs.has(refNum)) {
      ordersExist++;
      continue;
    }

    const b = billingByOrderId.get(o.order_id);
    const email = ANON(b?.billing_email) ? null : b.billing_email.toLowerCase().trim();
    if (!email && !INCLUDE_ANONYMIZED) {
      ordersAnonSkipped++;
      continue;
    }

    const aceUser = email ? emailToAceUser.get(email) : null;
    const fullName = [clean(b?.first_name), clean(b?.last_name)].filter(Boolean).join(" ") || null;
    const lineItems = itemsByOrder.get(o.order_id) ?? [];
    const subtotal = parseFloat(o.net_total) || 0;
    const total = parseFloat(o.total_sales) || 0;

    if (DRY_RUN) {
      ordersOk++;
      itemsOk += lineItems.length;
      if (ordersOk <= 5) console.log(`  WOULD CREATE: ${refNum} (${email ?? "anonymized"}) — ${lineItems.length} item(s), $${total}`);
      continue;
    }

    const shippingAddress = {
      ...(fullName ? { recipient_name: fullName } : {}),
      ...(clean(b?.company) ? { company: clean(b.company) } : {}),
      ...(clean(b?.address_1) ? { address_line1: clean(b.address_1) } : {}),
      ...(clean(b?.city) ? { city: clean(b.city) } : {}),
      ...(clean(b?.state) ? { state: clean(b.state) } : {}),
      ...(clean(b?.zip) ? { zip: clean(b.zip) } : {}),
      ...(clean(b?.country) ? { country: clean(b.country) } : {}),
      ...(clean(b?.phone) ? { phone: clean(b.phone) } : {}),
    };

    const { data: newOrder, error } = await target
      .from("orders")
      .insert({
        user_id: aceUser?.id ?? null,
        reference_number: refNum,
        status: mapStatus(o.status),
        subtotal,
        shipping_amount: parseFloat(o.shipping_total) || 0,
        total,
        shipping_address: shippingAddress,
        customer_name: fullName,
        customer_email: email ?? "",
        created_at: toIso(o.date_created_gmt),
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  FAIL: ${refNum} — ${error.message}`);
      ordersFail++;
      continue;
    }

    for (const it of lineItems) {
      const qty = Math.max(1, parseInt(it.product_qty) || 1);
      const lineNet = parseFloat(it.product_net_revenue) || 0;
      const unitPrice = Number((lineNet / qty).toFixed(2));
      const { error: iErr } = await target.from("order_items").insert({
        order_id: newOrder.id,
        product_id: null, // old WP product ids don't exist in the new catalog
        product_name: productNames[it.product_id] ?? `Product #${it.product_id}`,
        quantity: qty,
        unit_price: unitPrice,
        total_price: Number((unitPrice * qty).toFixed(2)),
      });
      if (iErr) console.error(`    ITEM FAIL (${refNum}): ${iErr.message}`);
      else itemsOk++;
    }

    ordersOk++;
    if (ordersOk % 100 === 0) console.log(`  …${ordersOk} orders migrated`);
  }

  console.log(`Orders: migrated=${ordersOk} already-present=${ordersExist} failed=${ordersFail} anonymized-skipped=${ordersAnonSkipped}`);
  console.log(`Items: migrated=${itemsOk}`);
  console.log(`\nDone.${DRY_RUN ? " (dry run — nothing written)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
