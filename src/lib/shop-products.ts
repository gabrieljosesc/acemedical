import { createAdminClient } from "@/lib/supabase/server";
import type { CatalogProduct, ProductDetail } from "@/lib/types";
import { parsePriceTiers } from "@/lib/price-tiers";

export type ShopSort = "latest" | "best-selling" | "price_asc" | "price_desc" | "name_asc";

export interface ShopFilterParams {
  search?: string;
  category?: string; // category slug
  brand?: string; // brand slug
  min_price?: string;
  max_price?: string;
  sort?: ShopSort;
  page?: number;
  pageSize?: number;
}

export type ShopFilterOption = { slug: string; name: string };

const PRODUCT_FIELDS =
  "id, slug, name, sku, price, price_tiers, stock_quantity, is_in_stock, specs, images, brands(name), categories(name)";

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function mapRow(row: {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  price: number | string;
  stock_quantity: number | null;
  is_in_stock: boolean;
  specs: unknown;
  price_tiers?: unknown;
  images: string[] | null;
  brands: { name: string } | { name: string }[] | null;
  categories: { name: string } | { name: string }[] | null;
}): CatalogProduct {
  const specs = (row.specs ?? []) as Array<{ label: string; value: string }>;
  const specLine = specs.map((s) => s.value).join(" · ");
  const brand = Array.isArray(row.brands) ? row.brands[0]?.name : row.brands?.name;
  const category = Array.isArray(row.categories) ? row.categories[0]?.name : row.categories?.name;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: brand ?? null,
    price: Number(row.price),
    sku: row.sku,
    specLine: specLine || "",
    stockLabel: !row.is_in_stock
      ? "out-of-stock"
      : (row.stock_quantity ?? 999) <= 10
        ? "low-stock"
        : "in-stock",
    categoryLabel: category ?? "",
    image: row.images?.[0] ?? null,
    priceTiers: parsePriceTiers(row.price_tiers),
  };
}

export async function getShopProducts(
  filters: ShopFilterParams
): Promise<{ products: CatalogProduct[]; count: number }> {
  if (!isSupabaseConfigured()) return { products: [], count: 0 };

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 12;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const admin = createAdminClient();

  let categoryId: string | undefined;
  if (filters.category) {
    const { data } = await admin.from("categories").select("id").eq("slug", filters.category).single();
    categoryId = data?.id;
    if (!categoryId) return { products: [], count: 0 };
  }

  let brandId: string | undefined;
  if (filters.brand) {
    const { data } = await admin.from("brands").select("id").eq("slug", filters.brand).single();
    brandId = data?.id;
    if (!brandId) return { products: [], count: 0 };
  }

  let query = admin.from("products").select(PRODUCT_FIELDS, { count: "exact" });

  if (filters.search) query = query.ilike("name", `%${filters.search}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (brandId) query = query.eq("brand_id", brandId);
  if (filters.min_price) query = query.gte("price", Number(filters.min_price));
  if (filters.max_price) query = query.lte("price", Number(filters.max_price));

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "best-selling":
      query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(start, end);
  if (error || !data) return { products: [], count: 0 };

  return { products: data.map(mapRow), count: count ?? 0 };
}

export async function getShopFilterOptions(categorySlug?: string): Promise<{
  categories: ShopFilterOption[];
  brands: ShopFilterOption[];
}> {
  if (!isSupabaseConfigured()) return { categories: [], brands: [] };

  const admin = createAdminClient();
  const [{ data: categories }, { data: allBrands }] = await Promise.all([
    admin.from("categories").select("slug, name").is("parent_id", null).order("sort_order"),
    admin.from("brands").select("id, slug, name").order("name"),
  ]);

  if (!categorySlug) {
    return {
      categories: categories ?? [],
      brands: (allBrands ?? []).map(({ slug, name }) => ({ slug, name })),
    };
  }

  // Scope the brand list to brands that actually have a product in this
  // category — otherwise most brand filters on a category page would be
  // dead ends ("No results") for brands sold under a different category.
  const { data: category } = await admin.from("categories").select("id").eq("slug", categorySlug).single();
  if (!category) return { categories: categories ?? [], brands: [] };

  const { data: productBrands } = await admin
    .from("products")
    .select("brand_id")
    .eq("category_id", category.id)
    .not("brand_id", "is", null);

  const brandIdsInCategory = new Set((productBrands ?? []).map((p) => p.brand_id));
  const brands = (allBrands ?? [])
    .filter((b) => brandIdsInCategory.has(b.id))
    .map(({ slug, name }) => ({ slug, name }));

  return { categories: categories ?? [], brands };
}

export async function getCategoryBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("categories").select("slug, name, description").eq("slug", slug).single();
  return data;
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select(
      "id, slug, name, sku, price, price_tiers, stock_quantity, is_in_stock, specs, images, coa_url, description, brands(name), categories(name, slug)"
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  const catalog = mapRow(data);
  const specs = (data.specs ?? []) as Array<{ label: string; value: string }>;
  const category = Array.isArray(data.categories) ? data.categories[0] : data.categories;

  return {
    ...catalog,
    description: data.description ?? null,
    categorySlug: category?.slug ?? "",
    specs,
    images: data.images ?? [],
    coaUrl: data.coa_url ?? null,
  };
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeId: string,
  limit = 4
): Promise<CatalogProduct[]> {
  if (!isSupabaseConfigured() || !categorySlug) return [];

  const admin = createAdminClient();
  const { data: category } = await admin.from("categories").select("id").eq("slug", categorySlug).single();
  if (!category) return [];

  const { data } = await admin
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("category_id", category.id)
    .neq("id", excludeId)
    .limit(limit);

  return (data ?? []).map(mapRow);
}

export async function getTopBrands(limit = 8): Promise<ShopFilterOption[]> {
  if (!isSupabaseConfigured()) return [];

  const admin = createAdminClient();
  const { data } = await admin.from("brands").select("slug, name, products(count)");
  if (!data) return [];

  return data
    .map((b) => ({
      slug: b.slug,
      name: b.name,
      count: Array.isArray(b.products) ? (b.products[0]?.count ?? 0) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ slug, name }) => ({ slug, name }));
}
