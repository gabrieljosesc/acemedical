/**
 * Gives every peptide product a volume-pricing ladder, matching the bracket
 * structure used across the rest of the catalog (1–5 / 6–10 / 11–20 / 21+).
 *
 * peakmedical's peptides carry no price_tiers (verified against its live DB
 * and site), so the discount ladder here is derived from Ace Medical's own
 * existing tiered products: list price up to 5 units, then −5% / −10% / −15%,
 * rounded to whole dollars.
 *
 * Idempotent: recomputes from products.price each run.
 * Run from acemedical/: node scripts/backfill-peptide-tiers.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function tiersFor(price) {
  const step = (pct) => Math.max(1, Math.round(price * (1 - pct)));
  return [
    { minQ: 1, maxQ: 5, price },
    { minQ: 6, maxQ: 10, price: step(0.05) },
    { minQ: 11, maxQ: 20, price: step(0.1) },
    { minQ: 21, maxQ: 1000, price: step(0.15) },
  ];
}

const { data: category, error: cErr } = await db
  .from("categories")
  .select("id")
  .eq("slug", "peptides")
  .single();
if (cErr) throw cErr;

const { data: products, error: pErr } = await db
  .from("products")
  .select("id, slug, price")
  .eq("category_id", category.id);
if (pErr) throw pErr;

let updated = 0;
for (const p of products) {
  if (!(p.price > 0)) {
    console.warn(`skip ${p.slug}: no price`);
    continue;
  }
  const { error } = await db.from("products").update({ price_tiers: tiersFor(p.price) }).eq("id", p.id);
  if (error) {
    console.error(`✗ ${p.slug}: ${error.message}`);
  } else {
    updated++;
  }
}
console.log(`Done. ${updated}/${products.length} peptides updated with volume tiers.`);
