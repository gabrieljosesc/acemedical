export type StockLabel = "in-stock" | "low-stock" | "out-of-stock";

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  sku: string | null;
  specLine: string;
  stockLabel: StockLabel;
  categoryLabel: string;
};

export type ProductDetail = CatalogProduct & {
  description: string | null;
  categorySlug: string;
  specs: Array<{ label: string; value: string }>;
};
