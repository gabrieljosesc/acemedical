import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { parsePriceTiers } from "@/lib/price-tiers";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "Edit product — Admin" };

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: product }, { data: categories }, { data: brands }] = await Promise.all([
    admin.from("products").select("*").eq("id", id).single(),
    admin.from("categories").select("id, name").order("sort_order"),
    admin.from("brands").select("id, name").order("name"),
  ]);

  if (!product) notFound();

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-4">
        <Link href="/admin/products" className="hover:text-teal transition-colors">
          Products
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink truncate max-w-[280px]">{product.name}</span>
      </nav>
      <h1 className="font-serif font-medium text-[26px] tracking-tight mb-7">Edit product</h1>

      <ProductForm
        productId={product.id}
        initial={{
          name: product.name,
          slug: product.slug,
          sku: product.sku ?? "",
          price: Number(product.price),
          priceTiers: parsePriceTiers(product.price_tiers),
          stockQuantity: product.stock_quantity,
          isInStock: product.is_in_stock,
          featured: product.featured,
          categoryId: product.category_id,
          brandId: product.brand_id,
          description: product.description ?? "",
          images: product.images ?? [],
          coaUrl: product.coa_url ?? null,
        }}
        categories={categories ?? []}
        brands={brands ?? []}
      />
    </div>
  );
}
