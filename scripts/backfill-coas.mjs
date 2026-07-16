/**
 * Backfills products.coa_url from the sibling peakmedical project:
 * its src/data/coa-manifest.json (slug → COA PDFs in peak's public
 * product-coas bucket) plus any products.coa_url values in its DB.
 * Matched by slug; the first (most recent) COA per product is used.
 *
 *   node scripts/backfill-coas.mjs
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

const peakRoot = path.join(__dirname, "..", "..", "peakmedical");
const peakEnv = parseEnvFile(path.join(peakRoot, ".env.local"));
const source = createClient(peakEnv.NEXT_PUBLIC_SUPABASE_URL, peakEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const target = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// slug → url, manifest first (first entry = preferred), DB coa_url as fallback
const coaBySlug = new Map();

const manifest = JSON.parse(fs.readFileSync(path.join(peakRoot, "src", "data", "coa-manifest.json"), "utf8"));
for (const [slug, entry] of Object.entries(manifest)) {
  const url = Array.isArray(entry) ? entry[0]?.url : typeof entry === "string" ? entry : null;
  if (url) coaBySlug.set(slug, url);
}
console.log(`manifest COAs: ${coaBySlug.size}`);

const { data: peakProducts } = await source.from("products").select("slug, coa_url").not("coa_url", "is", null);
for (const p of peakProducts ?? []) {
  if (!coaBySlug.has(p.slug)) coaBySlug.set(p.slug, p.coa_url);
}
console.log(`total slugs with a COA: ${coaBySlug.size}`);

const { data: targets } = await target.from("products").select("id, slug");
let updated = 0;
for (const p of targets ?? []) {
  const url = coaBySlug.get(p.slug);
  if (!url) continue;
  const { error } = await target.from("products").update({ coa_url: url }).eq("id", p.id);
  if (error) console.error(`✗ ${p.slug}: ${error.message}`);
  else updated++;
}
console.log(`Done. ${updated} products updated with COA links.`);
