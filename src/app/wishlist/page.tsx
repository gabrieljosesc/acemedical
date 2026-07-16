import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, ArrowRight } from "lucide-react";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { mapRow } from "@/lib/shop-products";
import ProductCard from "@/components/products/ProductCard";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login?next=/wishlist");
  }

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("wishlist_items")
    .select(
      "product:products(id, slug, name, sku, price, price_tiers, stock_quantity, is_in_stock, specs, images, brands(name), categories(name))"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const products = (items ?? [])
    .map((i) => (Array.isArray(i.product) ? i.product[0] : i.product))
    .filter(Boolean)
    .map((p) => mapRow(p as Parameters<typeof mapRow>[0]));

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-10 py-10">
      <h1 className="font-serif font-medium text-[30px] sm:text-[36px] tracking-tight mb-2">Wishlist</h1>
      <p className="text-[14px] text-ink-soft mb-8">{products.length} saved item{products.length === 1 ? "" : "s"}</p>

      {products.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-line rounded-[4px] max-w-[560px] mx-auto">
          <Heart size={28} className="text-ink-faint mx-auto mb-3" />
          <p className="text-[14.5px] font-medium text-ink">Nothing saved yet</p>
          <p className="text-[13px] text-ink-soft mt-1 mb-5">Tap the heart on any product to keep it here.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-5 py-2.5 hover:bg-teal-deep transition-colors"
          >
            Browse the catalog
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
