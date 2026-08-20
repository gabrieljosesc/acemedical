/**
 * Old-site → Ace Medical migration (users + orders + order items).
 *
 * Modeled on peakmedical's WordPress migration: expects the same three
 * CSV exports from the old site's database —
 *   users.csv   columns: ID, user_email, first_name, last_name, phone, company
 *   orders.csv  columns: order_id, wp_customer_id, email, status, total,
 *               first_name, last_name, company, phone, address_1, address_2,
 *               city, state, zip, country, notes, created_at
 *   items.csv   columns: order_id, product_title, quantity, unit_price
 *               (unit_price = the LINE subtotal, per WooCommerce export)
 *
 * What it does:
 *  1. Creates an auth account per old user (email_confirm=true, NO
 *     password, user_metadata.migrated=true) — nobody is emailed.
 *     Profiles auto-fill via the handle_new_user trigger.
 *  2. Creates orders (reference "WP-<order_id>", original dates kept)
 *     linked by email, then line items.
 *
 * Idempotent: existing emails are reused, orders are skipped by
 * reference_number.
 *
 * Usage (from acemedical/):
 *   node scripts/migrate-old-site.mjs --dry-run [users.csv] [orders.csv] [items.csv]
 *   node scripts/migrate-old-site.mjs [users.csv] [orders.csv] [items.csv]
 *
 * Defaults to C:\Users\63950\Downloads\wp_users.csv / wp_posts.csv /
 * wp_woocommerce_order_items.csv.
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
const fileArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const DOWNLOADS = "C:\\Users\\63950\\Downloads";
const USERS_CSV = fileArgs[0] || path.join(DOWNLOADS, "wp_users.csv");
const ORDERS_CSV = fileArgs[1] || path.join(DOWNLOADS, "wp_posts.csv");
const ITEMS_CSV = fileArgs[2] || path.join(DOWNLOADS, "wp_woocommerce_order_items.csv");

// Old-site admin / developer accounts — never migrated as customers.
// Add any others here before running.
const SKIP_EMAILS = new Set([
  "info@acemedicalwholesale.com",
  "admin@acemedical.com",
  "ramosarnoldph@gmail.com",
  "radiogagadesign@gmail.com",
]);

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

// ── Tiny CSV parser (same as peak's migration) ─────────────────────
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    if (!vals.length) continue;
    const row = {};
    headers.forEach((h, idx) => {
      const v = vals[idx];
      row[h] = v === undefined || v === "NULL" ? null : v;
    });
    rows.push(row);
  }
  return rows;
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env vars in .env.local");
    process.exit(1);
  }
  for (const f of [USERS_CSV, ORDERS_CSV, ITEMS_CSV]) {
    if (!fs.existsSync(f)) {
      console.error("File not found:", f);
      process.exit(1);
    }
  }

  const target = createClient(url, key, { auth: { persistSession: false } });

  console.log("Reading CSV files…");
  const wpUsers = parseCSV(USERS_CSV);
  const wpOrders = parseCSV(ORDERS_CSV);
  const wpItems = parseCSV(ITEMS_CSV);
  console.log(`  users=${wpUsers.length} orders=${wpOrders.length} items=${wpItems.length}`);
  console.log(`  user columns: ${Object.keys(wpUsers[0] ?? {}).join(", ")}`);
  console.log(`  order columns: ${Object.keys(wpOrders[0] ?? {}).join(", ")}`);
  console.log(`  item columns: ${Object.keys(wpItems[0] ?? {}).join(", ")}`);

  const existing = await fetchAllAuthUsers(target);
  const emailToAceId = new Map(existing.map((u) => [u.email?.toLowerCase(), u.id]));
  const { data: existingOrders } = await target.from("orders").select("reference_number");
  const existingRefs = new Set((existingOrders ?? []).map((o) => o.reference_number));
  console.log(`  existing ace users=${existing.length} orders=${existingRefs.size}`);

  // ── Step 1: users ────────────────────────────────────────────────
  console.log("\n--- Users ---");
  const wpIdToAceId = new Map();
  let created = 0, existed = 0, skipped = 0, failed = 0;

  for (const u of wpUsers) {
    const email = (u.user_email ?? "").toLowerCase().trim();
    if (!email || SKIP_EMAILS.has(email)) {
      skipped++;
      continue;
    }
    if (emailToAceId.has(email)) {
      wpIdToAceId.set(u.ID, emailToAceId.get(email));
      existed++;
      continue;
    }

    const metadata = {
      migrated: true,
      migrated_from: "old-site",
      wp_user_id: u.ID,
      first_name: u.first_name || undefined,
      last_name: u.last_name || undefined,
      phone: u.phone || undefined,
      company: u.company || undefined,
    };
    for (const k of Object.keys(metadata)) if (metadata[k] === undefined) delete metadata[k];

    if (DRY_RUN) {
      created++;
      if (created <= 5) console.log(`  WOULD CREATE: ${email}`);
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
    wpIdToAceId.set(u.ID, data.user.id);
    emailToAceId.set(email, data.user.id);
    created++;
    if (created % 100 === 0) console.log(`  …${created} users created`);
    await sleep(60);
  }
  console.log(`Users: created=${created} existed=${existed} skipped=${skipped} failed=${failed}`);

  // ── Step 2: orders ───────────────────────────────────────────────
  console.log("\n--- Orders ---");
  const itemsByOrder = new Map();
  for (const it of wpItems) {
    if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
    itemsByOrder.get(it.order_id).push(it);
  }

  let ordersOk = 0, ordersExist = 0, ordersFail = 0, itemsOk = 0;

  for (const o of wpOrders) {
    const refNum = `WP-${o.order_id}`;
    if (existingRefs.has(refNum)) {
      ordersExist++;
      continue;
    }

    const email = (o.email ?? "").toLowerCase().trim();
    const userId = emailToAceId.get(email) ?? wpIdToAceId.get(o.wp_customer_id) ?? null;
    const lineItems = itemsByOrder.get(o.order_id) ?? [];
    const subtotal = parseFloat(o.total) || 0;

    if (DRY_RUN) {
      ordersOk++;
      itemsOk += lineItems.length;
      if (ordersOk <= 5) console.log(`  WOULD CREATE: ${refNum} (${o.email}) — ${lineItems.length} item(s), $${subtotal}`);
      continue;
    }

    const { data: newOrder, error } = await target
      .from("orders")
      .insert({
        user_id: userId,
        reference_number: refNum,
        status: mapStatus(o.status),
        subtotal,
        total: subtotal,
        shipping_address: {
          first_name: o.first_name ?? "",
          last_name: o.last_name ?? "",
          company: o.company ?? "",
          address_line1: o.address_1 ?? "",
          address_line2: o.address_2 ?? "",
          city: o.city ?? "",
          state: o.state ?? "",
          zip: o.zip ?? "",
          country: o.country ?? "",
          phone: o.phone ?? "",
        },
        customer_name: `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim() || null,
        customer_email: o.email || "",
        notes: o.notes || null,
        created_at: o.created_at,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  FAIL: ${refNum} — ${error.message}`);
      ordersFail++;
      continue;
    }

    for (const it of lineItems) {
      const qty = Math.max(1, parseInt(it.quantity) || 1);
      const lineTotal = parseFloat(it.unit_price) || 0;
      const unitPrice = Number((lineTotal / qty).toFixed(2));
      const { error: iErr } = await target.from("order_items").insert({
        order_id: newOrder.id,
        product_id: null, // historical products aren't in the new catalog
        product_name: it.product_title,
        quantity: qty,
        unit_price: unitPrice,
        total_price: Number((unitPrice * qty).toFixed(2)),
      });
      if (iErr) console.error(`    ITEM FAIL (${refNum}): ${iErr.message}`);
      else itemsOk++;
    }

    ordersOk++;
    if (ordersOk % 50 === 0) console.log(`  …${ordersOk} orders migrated`);
  }

  console.log(`Orders: migrated=${ordersOk} already-present=${ordersExist} failed=${ordersFail}`);
  console.log(`Items: migrated=${itemsOk}`);
  console.log(`\nDone.${DRY_RUN ? " (dry run — nothing written)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
