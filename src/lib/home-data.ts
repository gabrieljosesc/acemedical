import { createAdminClient } from "@/lib/supabase/server";
import { mapRow } from "@/lib/shop-products";
import type { CatalogProduct } from "@/lib/types";

export type HomeCategory = {
  slug: string;
  name: string;
  productCount: number;
};

export type HeroProduct = CatalogProduct & {
  specs: Array<{ label: string; value: string }>;
};

const PRODUCT_FIELDS =
  "id, slug, name, sku, price, price_tiers, stock_quantity, is_in_stock, specs, images, brands(name), categories(name)";

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Placeholder catalog shown only if Supabase isn't configured yet, or a
// query genuinely returns nothing (e.g. before any product is seeded).
const FALLBACK_CATEGORIES: HomeCategory[] = [
  { slug: "dermal-fillers", name: "Dermal Fillers", productCount: 0 },
  { slug: "botulinum-toxins", name: "Botulinum Toxins", productCount: 0 },
  { slug: "orthopedic-injections", name: "Orthopedic Injections", productCount: 0 },
  { slug: "threads", name: "Threads", productCount: 0 },
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
  image: null,
  priceTiers: [],
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
  if (!isSupabaseConfigured()) return [];

  try {
    const admin = createAdminClient();
    const { data: products, error } = await admin
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("featured", true)
      .eq("is_in_stock", true)
      .limit(4);

    if (error || !products) return [];

    return products.map(mapRow);
  } catch {
    return [];
  }
}

export async function getHeroProduct(): Promise<HeroProduct> {
  if (!isSupabaseConfigured()) return FALLBACK_HERO_PRODUCT;

  try {
    const admin = createAdminClient();
    // Prefer a featured product that actually has a photo and a real spec
    // sheet, since those make the best hero. Fall back to any featured
    // product, then to the placeholder if the catalog is empty.
    const { data: products } = await admin
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("featured", true)
      .eq("is_in_stock", true)
      .limit(20);

    if (!products || products.length === 0) return FALLBACK_HERO_PRODUCT;

    const withImage = products.find((p) => (p.images ?? []).length > 0) ?? products[0];
    const catalog = mapRow(withImage);
    const specs = (withImage.specs ?? []) as Array<{ label: string; value: string }>;

    return { ...catalog, specs };
  } catch {
    return FALLBACK_HERO_PRODUCT;
  }
}
