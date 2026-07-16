/**
 * Backfills products.price_tiers from the sibling peakmedical project's
 * catalog (matched by slug). Run after supabase/store-completeness.sql:
 *   node scripts/backfill-price-tiers.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

function parseEnvFile(filePath) {
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const peakEnv = parseEnvFile(path.join(__dirname, "..", "..", "peakmedical", ".env.local"));
const source = createClient(peakEnv.NEXT_PUBLIC_SUPABASE_URL, peakEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const target = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const pageSize = 500;
let from = 0;
const sourceTiers = new Map();
for (;;) {
  const { data, error } = await source
    .from("products")
    .select("slug, price_tiers")
    .range(from, from + pageSize - 1);
  if (error) throw error;
  if (!data?.length) break;
  for (const p of data) {
    if (Array.isArray(p.price_tiers) && p.price_tiers.length > 0) {
      sourceTiers.set(p.slug, p.price_tiers);
    }
  }
  if (data.length < pageSize) break;
  from += pageSize;
}
console.log(`peakmedical products with tiers: ${sourceTiers.size}`);

const { data: targets, error: tErr } = await target.from("products").select("id, slug");
if (tErr) throw tErr;

let updated = 0;
for (const p of targets) {
  const tiers = sourceTiers.get(p.slug);
  if (!tiers) continue;
  const { error } = await target.from("products").update({ price_tiers: tiers }).eq("id", p.id);
  if (error) {
    console.error(`✗ ${p.slug}: ${error.message}`);
  } else {
    updated++;
  }
}
console.log(`Done. ${updated} products updated with volume tiers.`);
