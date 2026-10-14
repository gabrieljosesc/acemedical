/**
 * Adds the three peptide companion products (client items 100495–100497):
 *  - Hospira Sterile Water for Injection 50 mL — $25 flat (no volume pricing)
 *  - Covidien Webcol Large Alcohol Prep Pads (10/pk) — FREE with peptide orders
 *  - SureComfort U-100 Insulin Syringes 31G 1cc 5/16" (10/pk) — FREE with peptide orders
 *
 * Requires the products.is_free column:
 *   alter table public.products add column if not exists is_free boolean not null default false;
 *
 * Idempotent: upserts by slug, re-uploads the image into the product-images bucket
 * and writes its public URL into products.images[0].
 * Usage: node scripts/add-peptide-companions.mjs [--imgdir=<folder with water.jpg,pads.png,syringe.png>]
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.slice(2).split("=");
      return [k, v ?? true];
    })
);
const IMGDIR = args.imgdir;
const BUCKET = "product-images";

const PRODUCTS = [
  {
    slug: "hospira-sterile-water-for-injection-50ml",
    sku: "100495",
    name: "Hospira Sterile Water for Injection, USP – 50 mL Vial",
    price: 25,
    is_free: false,
    specs: [
      { label: "Volume", value: "50 mL" },
      { label: "NDC", value: "0409-4887-50" },
    ],
    image: { file: "water.jpg", ext: "jpg", type: "image/jpeg" },
    description:
      "Hospira Sterile Water for Injection, USP, supplied in a 50 mL single-dose plastic fliptop vial (NDC 0409-4887-50). Sterile, nonpyrogenic, preservative-free water for use as a diluent when reconstituting lyophilized peptides.\n\n" +
      "Companion product: offered alongside our research peptide line and intended to accompany peptide orders.\n\n" +
      "Packaging: 50 mL per bottle.\nPricing: $25.00 per bottle, flat — the same price at any quantity (no volume-based price changes).\n\n" +
      "For drug diluent use only. Store at 20°C to 25°C (68°F to 77°F).",
  },
  {
    slug: "covidien-webcol-large-alcohol-prep-pads",
    sku: "100496",
    name: "Covidien Webcol Large Alcohol Prep Pads (10-Pack)",
    price: 0,
    is_free: true,
    specs: [
      { label: "Pack", value: "10 pads" },
      { label: "Alcohol", value: "70% IPA" },
    ],
    image: { file: "pads.png", ext: "png", type: "image/png" },
    description:
      "Covidien Webcol™ sterile alcohol prep pads, large, 2-ply, saturated with 70% isopropyl alcohol. Individually wrapped for single use.\n\n" +
      "Complimentary with peptide orders: this item is offered free of charge as a companion to your peptide purchase. Add it to your cart with your peptides and it ships at no cost.\n\n" +
      "Packaging: 10 pads per pack.\nFor external use only.",
  },
  {
    slug: "surecomfort-u100-insulin-syringes-31g-1cc",
    sku: "100497",
    name: 'SureComfort U-100 Insulin Syringes, 31G × 5/16", 1cc (10-Pack)',
    price: 0,
    is_free: true,
    specs: [
      { label: "Pack", value: "10 syringes" },
      { label: "Needle", value: '31G × 5/16"' },
      { label: "Barrel", value: "1cc" },
    ],
    image: { file: "syringe.png", ext: "png", type: "image/png" },
    description:
      'SureComfort® U-100 insulin syringes with a permanently attached 31-gauge, 5/16" (8 mm) short needle and 1cc (1 mL) barrel. Sterile, single use, with clear unit markings for accurate dosing.\n\n' +
      "Complimentary with peptide orders: this item is offered free of charge as a companion to your peptide purchase. Add it to your cart with your peptides and it ships at no cost.\n\n" +
      "Packaging: 10 syringes per pack.\nUse once and destroy.",
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  const s = createClient(url, key, { auth: { persistSession: false } });

  const { data: cat, error: catErr } = await s.from("categories").select("id").eq("slug", "peptides").single();
  if (catErr || !cat) throw new Error("Peptides category not found");

  for (const p of PRODUCTS) {
    const row = {
      slug: p.slug,
      sku: p.sku,
      name: p.name,
      description: p.description,
      category_id: cat.id,
      brand_id: null,
      price: p.price,
      price_tiers: [],
      specs: p.specs,
      stock_quantity: null, // untracked
      is_in_stock: true,
      featured: false,
      is_free: p.is_free,
      updated_at: new Date().toISOString(),
    };
    const { data: prod, error } = await s.from("products").upsert(row, { onConflict: "slug" }).select("id").single();
    if (error) {
      console.error(`FAIL ${p.slug}: ${error.message}`);
      continue;
    }
    console.log(`✓ ${p.name} → ${prod.id} (${p.is_free ? "FREE" : "$" + p.price})`);

    if (!IMGDIR) continue;
    const file = path.join(IMGDIR, p.image.file);
    if (!fs.existsSync(file)) {
      console.warn(`  (no image file ${file})`);
      continue;
    }
    const objectPath = `uploads/companions/${p.slug}.${p.image.ext}`;
    const up = await s.storage
      .from(BUCKET)
      .upload(objectPath, fs.readFileSync(file), { contentType: p.image.type, upsert: true });
    if (up.error) {
      console.error(`  image upload failed: ${up.error.message}`);
      continue;
    }
    const publicUrl = s.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
    const { error: imgErr } = await s.from("products").update({ images: [publicUrl] }).eq("id", prod.id);
    if (imgErr) console.error(`  image link failed: ${imgErr.message}`);
    else console.log(`  image → ${publicUrl}`);
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
