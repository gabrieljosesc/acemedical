import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "New product — Admin" };

export default async function AdminNewProductPage() {
  const admin = createAdminClient();
  const [{ data: categories }, { data: brands }] = await Promise.all([
    admin.from("categories").select("id, name").order("sort_order"),
    admin.from("brands").select("id, name").order("name"),
  ]);

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-4">
        <Link href="/admin/products" className="hover:text-teal transition-colors">
          Products
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink">New</span>
      </nav>
      <h1 className="font-serif font-medium text-[26px] tracking-tight mb-7">New product</h1>

      <ProductForm
        productId={null}
        initial={{
          name: "",
          slug: "",
          sku: "",
          price: 0,
          priceTiers: [],
          stockQuantity: null,
          isInStock: true,
          featured: false,
          categoryId: null,
          brandId: null,
          description: "",
          images: [],
        }}
        categories={categories ?? []}
        brands={brands ?? []}
      />
    </div>
  );
}
