/**
 * One-time migration: pulls the real product catalog (categories, products,
 * images) from the sibling peakmedical project into Ace Medical Wholesale.
 *
 * peakmedical has no `brand` column on products — branded items encode the
 * brand in the title with a ® or ™ marker (e.g. "XEOMIN® 100u"). This script
 * derives a brand from that marker and creates it if new; unmarked items
 * (generic consumables, cannulas, etc.) are migrated with brand = null.
 *
 * Images are NOT re-uploaded — they're linked directly to peakmedical's
 * existing public Supabase Storage bucket. Re-hosting into Ace Medical's own
 * bucket is a reasonable follow-up, not required to ship this migration.
 *
 * price_tiers (peakmedical's volume-discount pricing) is intentionally not
 * migrated — Ace Medical's schema/UI doesn't model tiered pricing yet.
 *
 * Run from acemedical/: node scripts/migrate-from-peakmedical.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { createClient as createTargetClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetRoot = path.join(__dirname, "..");
const peakEnvPath = path.join(__dirname, "..", "..", "peakmedical", ".env.local");

dotenv.config({ path: path.join(targetRoot, ".env.local") });

// Parse peakmedical's .env.local manually so it never touches process.env —
// both projects use the same NEXT_PUBLIC_SUPABASE_URL / SERVICE_ROLE_KEY
// names, and dotenv.config() silently skips keys that already exist.
function parseEnvFile(filePath) {
  const out = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const peakEnv = parseEnvFile(peakEnvPath);
const source = createClient(peakEnv.NEXT_PUBLIC_SUPABASE_URL, peakEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const target = createTargetClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(s) {
  if (s !== s.toUpperCase()) return s; // already mixed case, leave as-is
  return s
    .split(" ")
    .map((w) => (w.length > 1 ? w[0] + w.slice(1).toLowerCase() : w))
    .join(" ");
}

const BRAND_MARK_RE = /^(.*?)[®™]/;

function deriveBrand(title) {
  const m = title.match(BRAND_MARK_RE);
  if (!m) return null;
  const raw = m[1].trim();
  if (!raw) return null;
  return titleCase(raw);
}

async function fetchAllProducts() {
  const pageSize = 200;
  let from = 0;
  const rows = [];
  for (;;) {
    const { data, error } = await source
      .from("products")
      .select(
        "slug, title, description, sku, base_price, is_featured, is_active, category:categories(slug), images:product_images(url, sort_order)"
      )
      .order("sort_order", { referencedTable: "product_images", ascending: true })
      .eq("is_active", true)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function main() {
  console.log("Fetching categories from peakmedical...");
  const { data: sourceCategories, error: catErr } = await source
    .from("categories")
    .select("slug, name, sort_order")
    .order("sort_order");
  if (catErr) throw catErr;
  console.log(`  ${sourceCategories.length} categories`);

  console.log("Upserting categories into acemedical...");
  const { error: catUpsertErr } = await target
    .from("categories")
    .upsert(sourceCategories, { onConflict: "slug" });
  if (catUpsertErr) throw catUpsertErr;

  // Upsert only adds/updates categories present in the source — it never
  // removes ones that used to exist under a different slug (e.g. an old
  // "pdo-threads" placeholder next to the real "threads" category). Drop
  // any category not in the source set, but only if nothing references it.
  const sourceSlugs = new Set(sourceCategories.map((c) => c.slug));
  const { data: allTargetCategories } = await target.from("categories").select("id, slug");
  const orphans = (allTargetCategories ?? []).filter((c) => !sourceSlugs.has(c.slug));
  for (const o of orphans) {
    const { count } = await target
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", o.id);
    if (count === 0) {
      await target.from("categories").delete().eq("id", o.id);
      console.log(`  removed orphaned category: ${o.slug}`);
    } else {
      console.log(`  kept orphaned category "${o.slug}" — still referenced by ${count} product(s)`);
    }
  }

  const { data: targetCategories } = await target.from("categories").select("id, slug");
  const catIdBySlug = Object.fromEntries(targetCategories.map((c) => [c.slug, c.id]));

  console.log("Fetching products from peakmedical (paginated)...");
  const products = await fetchAllProducts();
  console.log(`  ${products.length} active products`);

  console.log("Deriving brands from product titles (® / ™ markers)...");
  const brandSlugs = new Map(); // slug -> name
  for (const p of products) {
    const brand = deriveBrand(p.title);
    if (brand) brandSlugs.set(slugify(brand), brand);
  }
  const brandRows = [...brandSlugs.entries()].map(([slug, name]) => ({ slug, name }));
  console.log(`  ${brandRows.length} distinct brands detected`);

  console.log("Clearing existing (placeholder) brands and products...");
  await target.from("products").delete().not("id", "is", null);
  await target.from("brands").delete().not("id", "is", null);

  console.log("Inserting brands...");
  const { error: brandErr } = await target.from("brands").insert(brandRows);
  if (brandErr) throw brandErr;

  const { data: targetBrands } = await target.from("brands").select("id, slug");
  const brandIdBySlug = Object.fromEntries(targetBrands.map((b) => [b.slug, b.id]));

  console.log("Inserting products in batches of 50...");
  let inserted = 0;
  let skipped = 0;
  const BATCH = 50;
  for (let i = 0; i < products.length; i += BATCH) {
    const rows = products.slice(i, i + BATCH).flatMap((p) => {
      const categorySlug = Array.isArray(p.category) ? p.category[0]?.slug : p.category?.slug;
      const category_id = categorySlug ? catIdBySlug[categorySlug] : null;
      if (!category_id) {
        skipped++;
        return [];
      }
      const brand = deriveBrand(p.title);
      const brand_id = brand ? brandIdBySlug[slugify(brand)] ?? null : null;
      const images = (p.images ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => img.url);

      return [
        {
          name: p.title,
          slug: p.slug,
          sku: p.sku,
          price: p.base_price,
          stock_quantity: null,
          is_in_stock: true,
          category_id,
          brand_id,
          featured: p.is_featured,
          description: (p.description ?? "").replace(/<[^>]+>/g, "").trim() || null,
          specs: [],
          images,
        },
      ];
    });

    const { error } = await target.from("products").upsert(rows, { onConflict: "slug" });
    if (error) {
      console.error(`  batch ${i}-${i + BATCH} failed: ${error.message}`);
    } else {
      inserted += rows.length;
    }
    process.stdout.write(`\r  ${Math.min(i + BATCH, products.length)}/${products.length}`);
  }

  console.log(`\n\nDone. ${inserted} products migrated, ${skipped} skipped (unmapped category).`);
  console.log(`Categories: ${sourceCategories.length}. Brands: ${brandRows.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
