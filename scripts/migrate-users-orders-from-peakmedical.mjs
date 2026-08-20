/**
 * Migrates customers and order history from the sibling peakmedical
 * project's Supabase into Ace Medical Wholesale — the same playbook
 * peakmedical used for its own WordPress migration:
 *
 *  1. Creates an auth account per peak user (email_confirm=true, NO
 *     password) — profiles auto-populate via the handle_new_user
 *     trigger from the metadata passed here. Nobody is emailed.
 *  2. Copies orders + order items (original dates and reference
 *     numbers preserved), linking each to the new Ace user by email
 *     and each line item to the Ace product by slug where possible.
 *
 * Peak admin/dev accounts are skipped. payment_card_snapshot is NOT
 * copied (encrypted with peakmedical's key — undecryptable here).
 *
 * Idempotent: existing Ace emails are reused, orders are skipped by
 * reference_number, so re-running only fills gaps.
 *
 * Usage (from acemedical/):
 *   node scripts/migrate-users-orders-from-peakmedical.mjs --dry-run
 *   node scripts/migrate-users-orders-from-peakmedical.mjs
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

function parseEnvFile(filePath) {
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

// Works from the main checkout (../../peakmedical) and from .claude
// worktrees (which sit two levels deeper).
function findPeakEnv() {
  for (let up = path.join(__dirname, ".."); ; up = path.dirname(up)) {
    const candidate = path.join(up, "..", "peakmedical", ".env.local");
    if (fs.existsSync(candidate)) return candidate;
    if (path.dirname(up) === up) throw new Error("peakmedical/.env.local not found in any parent directory");
  }
}

const peakEnv = parseEnvFile(findPeakEnv());
const source = createClient(peakEnv.NEXT_PUBLIC_SUPABASE_URL, peakEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const target = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Peak admin / developer accounts — never migrated as customers.
const SKIP_EMAILS = new Set([
  "info@peakmedicalwholesale.com",
  "ramosarnoldph@gmail.com",
  "radiogagadesign@gmail.com",
]);

// peak order status → ace order status (ace: pending|confirmed|shipped|cancelled)
function mapStatus(s) {
  return { pending_csr: "pending", confirmed: "confirmed", shipped: "shipped", cancelled: "cancelled" }[s] ?? "pending";
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

async function fetchAll(client, table, columns, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client.from(table).select(columns).range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function splitName(fullName) {
  const name = (fullName ?? "").trim();
  if (!name) return { first: null, last: null };
  const parts = name.split(/\s+/);
  return { first: parts[0], last: parts.slice(1).join(" ") || null };
}

async function main() {
  console.log(DRY_RUN ? "── DRY RUN — no writes ──" : "── LIVE RUN ──");

  // ── Load source data ─────────────────────────────────────────────
  console.log("Loading peakmedical data…");
  const peakProfiles = await fetchAll(source, "profiles", "*");
  const peakOrders = await fetchAll(source, "orders", "*");
  const peakItems = await fetchAll(source, "order_items", "*");
  const peakProducts = await fetchAll(source, "products", "id, slug");
  console.log(
    `  profiles=${peakProfiles.length} orders=${peakOrders.length} items=${peakItems.length}`
  );

  // ── Load target state ────────────────────────────────────────────
  console.log("Loading acemedical state…");
  const aceUsers = await fetchAllAuthUsers(target);
  const aceByEmail = new Map(aceUsers.map((u) => [u.email?.toLowerCase(), u.id]));
  const aceProducts = await fetchAll(target, "products", "id, slug, images");
  const aceProductBySlug = new Map(aceProducts.map((p) => [p.slug, p]));
  const aceOrderRefs = new Set(
    (await fetchAll(target, "orders", "reference_number")).map((o) => o.reference_number)
  );
  console.log(`  existing users=${aceUsers.length} orders=${aceOrderRefs.size}`);

  const peakIdToSlug = new Map(peakProducts.map((p) => [p.id, p.slug]));

  // ── Step 1: users ────────────────────────────────────────────────
  console.log("\n--- Users ---");
  // peak user id → ace user id (for order linking)
  const peakIdToAceId = new Map();
  const emailToAceId = new Map(aceByEmail);
  let created = 0, existed = 0, skipped = 0, failed = 0;

  for (const p of peakProfiles) {
    const email = (p.email ?? "").toLowerCase().trim();
    if (!email || SKIP_EMAILS.has(email) || p.role === "admin") {
      skipped++;
      continue;
    }

    if (emailToAceId.has(email)) {
      peakIdToAceId.set(p.id, emailToAceId.get(email));
      existed++;
      continue;
    }

    const { first, last } = splitName(p.full_name);
    const metadata = {
      migrated: true,
      migrated_from: "peakmedical",
      first_name: first,
      last_name: last,
      company: p.company,
      phone: p.phone,
      license_number: p.license_number,
      prefix: p.prefix,
      middle_name: p.middle_name,
      license_holder_name: p.license_holder_name,
      profession: p.profession,
      specialty: p.specialty,
      license_expiry: p.license_expiry,
      license_state: p.license_state,
      license_country: p.license_country,
      business_phone: p.business_phone,
      website: p.website,
      address_line1: p.address_line1,
      city: p.city,
      state: p.state,
      postal_code: p.postal_code,
      country: p.country,
    };
    // strip null/empty so the profile trigger only sets real values
    for (const k of Object.keys(metadata)) {
      if (metadata[k] === null || metadata[k] === undefined || metadata[k] === "") delete metadata[k];
    }

    if (DRY_RUN) {
      created++;
      if (created <= 5) console.log(`  WOULD CREATE: ${email} (${p.full_name ?? "no name"})`);
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

    peakIdToAceId.set(p.id, data.user.id);
    emailToAceId.set(email, data.user.id);
    created++;
    if (created % 100 === 0) console.log(`  …${created} users created`);
    await sleep(60);
  }
  console.log(`Users: created=${created} existed=${existed} skipped(admin/no-email)=${skipped} failed=${failed}`);

  // ── Step 2: orders ───────────────────────────────────────────────
  console.log("\n--- Orders ---");
  const itemsByOrder = new Map();
  for (const it of peakItems) {
    if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
    itemsByOrder.get(it.order_id).push(it);
  }

  let ordersOk = 0, ordersExist = 0, ordersFail = 0, itemsOk = 0, itemsLinked = 0;

  for (const o of peakOrders) {
    if (aceOrderRefs.has(o.reference_number)) {
      ordersExist++;
      continue;
    }

    const email = (o.email ?? "").toLowerCase().trim();
    const userId = peakIdToAceId.get(o.user_id) ?? emailToAceId.get(email) ?? null;
    const lineItems = itemsByOrder.get(o.id) ?? [];

    if (DRY_RUN) {
      ordersOk++;
      itemsOk += lineItems.length;
      if (ordersOk <= 5)
        console.log(`  WOULD CREATE: ${o.reference_number} (${o.email}) — ${lineItems.length} item(s), $${o.total ?? o.subtotal}`);
      continue;
    }

    const { data: newOrder, error } = await target
      .from("orders")
      .insert({
        user_id: userId,
        reference_number: o.reference_number,
        status: mapStatus(o.status),
        subtotal: o.subtotal ?? 0,
        total: o.total ?? o.subtotal ?? 0,
        shipping_amount: o.shipping_amount ?? 0,
        coupon_code: o.coupon_code,
        discount_amount: o.discount_amount ?? 0,
        shipping_address: o.shipping_address ?? {},
        billing_address: o.billing_address,
        customer_name: o.full_name,
        customer_email: o.email,
        notes: o.customer_notes,
        admin_notes: o.admin_notes,
        customer_visible_note: o.customer_visible_note,
        policy_acknowledged_at: o.policy_acknowledged_at,
        created_at: o.created_at,
        updated_at: o.updated_at,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  FAIL: ${o.reference_number} — ${error.message}`);
      ordersFail++;
      continue;
    }

    for (const it of lineItems) {
      const qty = Math.max(1, it.quantity ?? 1);
      const unitPrice = Number(it.unit_price ?? 0);
      const aceProduct = aceProductBySlug.get(peakIdToSlug.get(it.product_id));
      if (aceProduct) itemsLinked++;
      const { error: iErr } = await target.from("order_items").insert({
        order_id: newOrder.id,
        product_id: aceProduct?.id ?? null,
        product_name: it.title,
        product_image: aceProduct?.images?.[0] ?? null,
        quantity: qty,
        unit_price: unitPrice,
        total_price: Number((unitPrice * qty).toFixed(2)),
      });
      if (iErr) console.error(`    ITEM FAIL (${o.reference_number}): ${iErr.message}`);
      else itemsOk++;
    }

    ordersOk++;
    if (ordersOk % 50 === 0) console.log(`  …${ordersOk} orders migrated`);
  }

  console.log(`Orders: migrated=${ordersOk} already-present=${ordersExist} failed=${ordersFail}`);
  console.log(`Items: migrated=${itemsOk} (linked to a live Ace product: ${itemsLinked})`);
  console.log(`\nDone.${DRY_RUN ? " (dry run — nothing written)" : " Next: node scripts/send-password-resets.mjs --help-first"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
