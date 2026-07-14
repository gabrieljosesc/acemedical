/**
 * Seeds categories, brands, and a starter product catalog for Ace Medical Wholesale.
 *
 * Run once after creating the Supabase project and running supabase/schema.sql:
 *   node scripts/seed-catalog.mjs
 *
 * Idempotent — safe to re-run (upserts by slug/sku).
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// specs is an ordered [{label, value}] array, not a plain object — jsonb
// objects don't preserve key insertion order, which would scramble the
// spec-grid display order on the product card.
const spec = (label, value) => ({ label, value });

// category slugs must match supabase/schema.sql seed
const PRODUCTS = [
  {
    name: "Juvéderm Voluma XC",
    slug: "juvederm-voluma-xc",
    sku: "JUV-VOL-2",
    price: 359,
    stock_quantity: 48,
    category: "dermal-fillers",
    brand: "allergan-aesthetics",
    featured: true,
    specs: [
      spec("Volume", "2 × 1.0 mL"),
      spec("HA conc.", "20 mg/mL"),
      spec("Lidocaine", "0.3%"),
      spec("Exp.", "2027-04"),
    ],
  },
  {
    name: "Juvéderm Ultra XC",
    slug: "juvederm-ultra-xc",
    sku: "JUV-ULT",
    price: 359,
    stock_quantity: 40,
    category: "dermal-fillers",
    brand: "allergan-aesthetics",
    featured: true,
    specs: [spec("Volume", "2 × 1.0 mL"), spec("HA conc.", "24 mg/mL"), spec("Lidocaine", "0.3%")],
  },
  {
    name: "Restylane Lyft",
    slug: "restylane-lyft",
    sku: "RES-LFT",
    price: 329,
    stock_quantity: 30,
    category: "dermal-fillers",
    brand: "galderma",
    featured: false,
    specs: [spec("Volume", "1 × 1.0 mL"), spec("HA conc.", "20 mg/mL")],
  },
  {
    name: "Synvisc-One",
    slug: "synvisc-one",
    sku: "SYN-ONE",
    price: 329,
    stock_quantity: 22,
    category: "orthopaedic-injectables",
    brand: "sanofi",
    featured: true,
    specs: [spec("Volume", "1 × 6 mL"), spec("Compound", "hylan G-F 20"), spec("Route", "intra-articular")],
  },
  {
    name: "Prolia 60 mg",
    slug: "prolia-60mg",
    sku: "PRO-60",
    price: 499,
    stock_quantity: 18,
    category: "orthopaedic-injectables",
    brand: "amgen",
    featured: true,
    specs: [spec("Volume", "1 × 1.0 mL"), spec("Compound", "denosumab"), spec("Format", "pre-filled")],
  },
  {
    name: "Botox 100 U",
    slug: "botox-100u",
    sku: "BTX-100",
    price: 549,
    stock_quantity: 8,
    category: "botulinum-toxins",
    brand: "allergan-aesthetics",
    featured: true,
    specs: [spec("Format", "1 vial"), spec("Units", "100 units"), spec("Compound", "onabotulinumtoxinA")],
  },
  {
    name: "Xeomin 100 U",
    slug: "xeomin-100u",
    sku: "XEO-100",
    price: 469,
    stock_quantity: 26,
    category: "botulinum-toxins",
    brand: "merz",
    featured: false,
    specs: [spec("Format", "1 vial"), spec("Units", "100 units"), spec("Compound", "incobotulinumtoxinA")],
  },
  {
    name: "PDO Mono Threads",
    slug: "pdo-mono-threads",
    sku: "PDO-MONO-30",
    price: 89,
    stock_quantity: 60,
    category: "pdo-threads",
    brand: null,
    featured: false,
    specs: [spec("Pack", "30 threads"), spec("Gauge", "29G"), spec("Length", "38 mm")],
  },
  {
    name: "PDO Cog Threads",
    slug: "pdo-cog-threads",
    sku: "PDO-COG-10",
    price: 149,
    stock_quantity: 34,
    category: "pdo-threads",
    brand: null,
    featured: false,
    specs: [spec("Pack", "10 threads"), spec("Gauge", "19G"), spec("Length", "100 mm")],
  },
  {
    name: "Lidocaine HCl 2%",
    slug: "lidocaine-hcl-2pct",
    sku: "LIDO-2-50",
    price: 45,
    stock_quantity: 90,
    category: "anaesthetics",
    brand: null,
    featured: false,
    specs: [spec("Volume", "1 × 50 mL"), spec("Concentration", "2%")],
  },
  {
    name: "Radiesse",
    slug: "radiesse",
    sku: "RAD-15",
    price: 339,
    stock_quantity: 20,
    category: "dermal-fillers",
    brand: "merz",
    featured: false,
    specs: [spec("Volume", "1 × 1.5 mL"), spec("Compound", "CaHA")],
  },
  {
    name: "TCA Peel 15%",
    slug: "tca-peel-15",
    sku: "TCA-15-30",
    price: 65,
    stock_quantity: 44,
    category: "mesotherapy-peels",
    brand: null,
    featured: false,
    specs: [spec("Volume", "30 mL"), spec("Concentration", "15%")],
  },
  {
    name: "Mesotherapy Vitamin Cocktail",
    slug: "meso-vitamin-cocktail",
    sku: "MESO-VIT-10",
    price: 119,
    stock_quantity: 25,
    category: "mesotherapy-peels",
    brand: null,
    featured: false,
    specs: [spec("Pack", "10 × 5 mL")],
  },
  {
    name: "Semaglutide Vial",
    slug: "semaglutide-vial",
    sku: "SEMA-5MG",
    price: 189,
    stock_quantity: 15,
    category: "weight-management",
    brand: null,
    featured: false,
    specs: [spec("Strength", "5 mg"), spec("Format", "multi-dose vial")],
  },
  {
    name: "PRP Prep Kit",
    slug: "prp-prep-kit",
    sku: "PRP-KIT-10",
    price: 175,
    stock_quantity: 38,
    category: "prp-kits",
    brand: null,
    featured: false,
    specs: [spec("Pack", "10 kits"), spec("Yield", "8-10 mL PRP")],
  },
  {
    name: "PRP Double-Spin Tubes",
    slug: "prp-double-spin-tubes",
    sku: "PRP-DS-20",
    price: 210,
    stock_quantity: 21,
    category: "prp-kits",
    brand: null,
    featured: false,
    specs: [spec("Pack", "20 tubes")],
  },
];

async function main() {
  const { data: categories } = await supabase.from("categories").select("id, slug");
  const { data: brands } = await supabase.from("brands").select("id, slug");

  const catBySlug = Object.fromEntries((categories ?? []).map((c) => [c.slug, c.id]));
  const brandBySlug = Object.fromEntries((brands ?? []).map((b) => [b.slug, b.id]));

  let ok = 0;
  let failed = 0;

  for (const p of PRODUCTS) {
    const category_id = catBySlug[p.category] ?? null;
    const brand_id = p.brand ? brandBySlug[p.brand] ?? null : null;

    if (!category_id) {
      console.warn(`skip ${p.slug}: unknown category "${p.category}" — run supabase/schema.sql first`);
      failed++;
      continue;
    }

    const { error } = await supabase.from("products").upsert(
      {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: p.price,
        stock_quantity: p.stock_quantity,
        is_in_stock: p.stock_quantity > 0,
        category_id,
        brand_id,
        featured: p.featured,
        specs: p.specs,
        images: [],
      },
      { onConflict: "slug" }
    );

    if (error) {
      console.error(`✗ ${p.slug}: ${error.message}`);
      failed++;
    } else {
      console.log(`✓ ${p.slug}`);
      ok++;
    }
  }

  console.log(`\nDone. ${ok} seeded, ${failed} failed.`);
}

main();
