import { createAdminClient } from "@/lib/supabase/server";
import type { CatalogProduct } from "@/lib/types";

export type HomeCategory = {
  slug: string;
  name: string;
  productCount: number;
};

export type HeroProduct = CatalogProduct & {
  specs: Array<{ label: string; value: string }>;
};

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Placeholder catalog shown until the Supabase project is created and seeded.
// Mirrors supabase/schema.sql exactly so swapping to live data is a no-op.
const FALLBACK_CATEGORIES: HomeCategory[] = [
  { slug: "dermal-fillers", name: "Dermal fillers", productCount: 142 },
  { slug: "orthopaedic-injectables", name: "Orthopaedic injectables", productCount: 63 },
  { slug: "botulinum-toxins", name: "Botulinum toxins", productCount: 28 },
  { slug: "pdo-threads", name: "PDO threads", productCount: 47 },
  { slug: "anaesthetics", name: "Anaesthetics", productCount: 34 },
  { slug: "mesotherapy-peels", name: "Mesotherapy & peels", productCount: 58 },
  { slug: "weight-management", name: "Weight management", productCount: 19 },
  { slug: "prp-kits", name: "PRP & kits", productCount: 22 },
];

const FALLBACK_BEST_SELLERS: CatalogProduct[] = [
  {
    id: "synvisc-one",
    slug: "synvisc-one",
    name: "Synvisc-One",
    brand: "Sanofi",
    price: 329,
    sku: "SYN-ONE",
    specLine: "1 × 6 mL · hylan G-F 20 · intra-articular",
    stockLabel: "in-stock",
    categoryLabel: "Orthopaedic",
  },
  {
    id: "prolia-60mg",
    slug: "prolia-60mg",
    name: "Prolia 60 mg",
    brand: "Amgen",
    price: 499,
    sku: "PRO-60",
    specLine: "1 × 1.0 mL · denosumab · pre-filled",
    stockLabel: "in-stock",
    categoryLabel: "Bone health",
  },
  {
    id: "juvederm-ultra-xc",
    slug: "juvederm-ultra-xc",
    name: "Juvéderm Ultra XC",
    brand: "Allergan Aesthetics",
    price: 359,
    sku: "JUV-ULT",
    specLine: "2 × 1.0 mL · 24 mg/mL HA · 0.3% lido",
    stockLabel: "in-stock",
    categoryLabel: "Dermal filler",
  },
  {
    id: "botox-100u",
    slug: "botox-100u",
    name: "Botox 100 U",
    brand: "Allergan Aesthetics",
    price: 549,
    sku: "BTX-100",
    specLine: "1 vial · 100 units · onabotulinumtoxinA",
    stockLabel: "low-stock",
    categoryLabel: "Botulinum toxin",
  },
];

const FALLBACK_HERO_PRODUCT: HeroProduct = {
  id: "juvederm-voluma-xc",
  slug: "juvederm-voluma-xc",
  name: "Juvéderm Voluma XC",
  brand: "Allergan Aesthetics",
  price: 359,
  sku: "JUV-VOL-2",
  specLine: "2 × 1.0 mL · 20 mg/mL HA",
  stockLabel: "in-stock",
  categoryLabel: "Dermal filler",
  specs: [
    { label: "Volume", value: "2 × 1.0 mL" },
    { label: "HA conc.", value: "20 mg/mL" },
    { label: "Lidocaine", value: "0.3%" },
    { label: "Exp.", value: "2027-04" },
  ],
};

export async function getHomeCategories(): Promise<HomeCategory[]> {
  if (!isSupabaseConfigured()) return FALLBACK_CATEGORIES;

  try {
    const admin = createAdminClient();
    const { data: categories, error } = await admin
      .from("categories")
      .select("slug, name, id")
      .is("parent_id", null)
      .order("sort_order")
      .limit(8);

    if (error || !categories || categories.length === 0) return FALLBACK_CATEGORIES;

    const withCounts = await Promise.all(
      categories.map(async (c) => {
        const { count } = await admin
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("category_id", c.id)
          .eq("is_in_stock", true);
        return { slug: c.slug, name: c.name, productCount: count ?? 0 };
      })
    );

    return withCounts;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function getBestSellers(): Promise<CatalogProduct[]> {
  if (!isSupabaseConfigured()) return FALLBACK_BEST_SELLERS;

  try {
    const admin = createAdminClient();
    const { data: products, error } = await admin
      .from("products")
      .select(
        "id, slug, name, sku, price, stock_quantity, is_in_stock, specs, brands(name), categories(name)"
      )
      .eq("featured", true)
      .eq("is_in_stock", true)
      .limit(4);

    if (error || !products || products.length === 0) return FALLBACK_BEST_SELLERS;

    return products.map((p): CatalogProduct => {
      // specs is stored as an ordered [{label, value}] array — jsonb objects
      // don't preserve key insertion order, so a plain dict would scramble it.
      const specs = (p.specs ?? []) as Array<{ label: string; value: string }>;
      const specLine = specs.map((s) => s.value).join(" · ");
      const brand = Array.isArray(p.brands) ? p.brands[0]?.name : (p.brands as { name: string } | null)?.name;
      const category = Array.isArray(p.categories) ? p.categories[0]?.name : (p.categories as { name: string } | null)?.name;
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: brand ?? null,
        price: Number(p.price),
        sku: p.sku,
        specLine: specLine || "",
        stockLabel: !p.is_in_stock ? "out-of-stock" : (p.stock_quantity ?? 999) <= 10 ? "low-stock" : "in-stock",
        categoryLabel: category ?? "",
      };
    });
  } catch {
    return FALLBACK_BEST_SELLERS;
  }
}

export async function getHeroProduct(): Promise<HeroProduct> {
  return FALLBACK_HERO_PRODUCT;
}
