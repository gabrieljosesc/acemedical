/**
 * Old acemedicalwholesale.com (WordPress/WooCommerce) → new site
 * migration: users + orders + order items.
 *
 * Consumes the raw table exports from the old site's database:
 *   wp_users (1).csv                 registered accounts
 *   wp_wc_customer_lookup.csv        customer_id → user/email/name  (REQUIRED — links orders to people)
 *   wp_wc_order_stats.csv            one row per order (totals, status, date)
 *   wp_wc_order_product_lookup.csv   line items (product_id, qty, revenue)
 *   scripts/old-shop-products.json   product_id → product name (harvested
 *                                    from the old shop's public API)
 *
 * What it does:
 *  1. Creates an auth account per registered old-site user
 *     (email_confirm=true, NO password, user_metadata.migrated=true) —
 *     nobody is emailed. Profiles auto-fill via the signup trigger.
 *  2. Creates orders as "WP-<order_id>" with original dates, totals and
 *     statuses, linked to the new account via the customer lookup;
 *     guest orders keep their email/name but no account.
 *  3. Creates line items with real product names where known.
 *
 * Idempotent: existing emails are reused, orders are skipped by
 * reference_number. Dev/admin accounts (forga.io etc.) are skipped.
 *
 * Usage (from the repo root):
 *   node scripts/migrate-old-site.mjs --dry-run
 *   node scripts/migrate-old-site.mjs
 *
 * CSVs are read from C:\Users\63950\Downloads by default; override with
 *   --dir="D:\some\folder"
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
const dirArg = process.argv.find((a) => a.startsWith("--dir="));
const DATA_DIR = dirArg ? dirArg.slice(6) : "C:\\Users\\63950\\Downloads";

const USERS_CSV = path.join(DATA_DIR, "wp_users (1).csv");
const CUSTOMERS_CSV = path.join(DATA_DIR, "wp_wc_customer_lookup.csv");
const STATS_CSV = path.join(DATA_DIR, "wp_wc_order_stats.csv");
const ITEMS_CSV = path.join(DATA_DIR, "wp_wc_order_product_lookup.csv");
const PRODUCTS_JSON = path.join(__dirname, "old-shop-products.json");

// Old-site admin / developer accounts — never migrated as customers.
const SKIP_EMAIL = (email) =>
  email.endsWith("@forga.io") ||
  ["info@acemedicalwholesale.com", "admin@acemedical.com"].includes(email);

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

  for (const f of [USERS_CSV, STATS_CSV, ITEMS_CSV, PRODUCTS_JSON]) {
    if (!fs.existsSync(f)) {
      console.error("File not found:", f);
      process.exit(1);
    }
  }
  if (!fs.existsSync(CUSTOMERS_CSV)) {
    console.error(
      `Missing ${CUSTOMERS_CSV}\n\n` +
        "wp_wc_customer_lookup is the bridge between orders and people (emails,\n" +
        "names). Export it from phpMyAdmin the same way as the other tables and\n" +
        "re-run — without it no order can be attributed to a customer."
    );
    process.exit(1);
  }

  const target = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log("Reading exports…");
  const wpUsers = parseCSV(USERS_CSV);
  const customers = parseCSV(CUSTOMERS_CSV);
  const stats = parseCSV(STATS_CSV).filter((s) => s.parent_id === "0");
  const items = parseCSV(ITEMS_CSV);
  const productNames = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));
  console.log(`  users=${wpUsers.length} customers=${customers.length} orders=${stats.length} items=${items.length}`);
  console.log(`  customer columns: ${Object.keys(customers[0] ?? {}).join(", ")}`);

  const customerById = new Map(customers.map((c) => [c.customer_id, c]));
  // wp user id → customer lookup row (for names at account creation)
  const customerByUserId = new Map(customers.filter((c) => c.user_id && c.user_id !== "0").map((c) => [c.user_id, c]));

  const existing = await fetchAllAuthUsers(target);
  const emailToAceId = new Map(existing.map((u) => [u.email?.toLowerCase(), u.id]));
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
    if (emailToAceId.has(email)) {
      existed++;
      continue;
    }

    const lookup = customerByUserId.get(u.ID);
    let first = lookup?.first_name?.trim() || null;
    let last = lookup?.last_name?.trim() || null;
    if (first === "[deleted]") first = null;
    if (last === "[deleted]") last = null;
    // display_name is often just the username ("97045") — only treat it
    // as a real name when it has multiple words. Real names for the rest
    // arrive with the billing-data backfill.
    const display = (u.display_name ?? "").trim();
    if (!first && /\s/.test(display) && display.toLowerCase() !== u.user_login?.toLowerCase()) {
      const parts = display.split(/\s+/);
      first = parts[0];
      last = parts.slice(1).join(" ") || null;
    }

    const metadata = {
      migrated: true,
      migrated_from: "acemedicalwholesale-wp",
      wp_user_id: u.ID,
      ...(first ? { first_name: first } : {}),
      ...(last ? { last_name: last } : {}),
      ...(lookup?.city ? { city: lookup.city } : {}),
      ...(lookup?.state ? { state: lookup.state } : {}),
      ...(lookup?.postcode ? { postal_code: lookup.postcode } : {}),
      ...(lookup?.country ? { country: lookup.country } : {}),
    };

    if (DRY_RUN) {
      created++;
      if (created <= 5) console.log(`  WOULD CREATE: ${email} (${[first, last].filter(Boolean).join(" ") || "no name"})`);
      continue;
    }

    const { data, error } = await target.auth.admin.createUser({
      email,
      email_confirm: true, // verified on the old site; no email is sent
      user_metadata: metadata,
    });
    if (error) {
      console.error(`  FAIL: ${email} — ${error.message}`);
      failed++;
      await sleep(500);
      continue;
    }
    emailToAceId.set(email, data.user.id);
    created++;
    if (created % 100 === 0) console.log(`  …${created} users created`);
    await sleep(60);
  }
  console.log(`Users: created=${created} existed=${existed} skipped=${skipped} failed=${failed}`);

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

  let ordersOk = 0, ordersExist = 0, ordersFail = 0, ordersNoCustomer = 0, itemsOk = 0;

  for (const o of stats) {
    const refNum = `WP-${o.order_id}`;
    if (existingRefs.has(refNum)) {
      ordersExist++;
      continue;
    }

    const cust = customerById.get(o.customer_id);
    const email = (cust?.email ?? "").toLowerCase().trim();
    if (!email) ordersNoCustomer++;
    const userId = email ? emailToAceId.get(email) ?? null : null;
    const fullName = [cust?.first_name, cust?.last_name].filter(Boolean).join(" ").trim() || cust?.username || null;
    const lineItems = itemsByOrder.get(o.order_id) ?? [];

    const subtotal = parseFloat(o.net_total) || 0;
    const total = parseFloat(o.total_sales) || 0;
    const shipping = parseFloat(o.shipping_total) || 0;

    if (DRY_RUN) {
      ordersOk++;
      itemsOk += lineItems.length;
      if (ordersOk <= 5) console.log(`  WOULD CREATE: ${refNum} (${email || "no customer"}) — ${lineItems.length} item(s), $${total}`);
      continue;
    }

    const { data: newOrder, error } = await target
      .from("orders")
      .insert({
        user_id: userId,
        reference_number: refNum,
        status: mapStatus(o.status),
        subtotal,
        shipping_amount: shipping,
        total,
        shipping_address: {
          ...(cust?.city ? { city: cust.city } : {}),
          ...(cust?.state ? { state: cust.state } : {}),
          ...(cust?.postcode ? { zip: cust.postcode } : {}),
          ...(cust?.country ? { country: cust.country } : {}),
        },
        customer_name: fullName,
        customer_email: email || "",
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
    if (ordersOk % 500 === 0) console.log(`  …${ordersOk} orders migrated`);
  }

  console.log(`Orders: migrated=${ordersOk} already-present=${ordersExist} failed=${ordersFail} (without matchable customer: ${ordersNoCustomer})`);
  console.log(`Items: migrated=${itemsOk}`);
  console.log(`\nDone.${DRY_RUN ? " (dry run — nothing written)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
