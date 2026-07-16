import Link from "next/link";
import Image from "next/image";
import { Search, Plus, Package } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Products — Admin" };

type RawSearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const q = one(raw.q);
  const page = Math.max(1, parseInt(one(raw.page) ?? "1", 10) || 1);
  const pageSize = 25;

  const admin = createAdminClient();
  let query = admin
    .from("products")
    .select("id, slug, name, sku, price, price_tiers, stock_quantity, is_in_stock, featured, images, categories(name)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q.replace(/[\\%_]/g, "")}%,sku.ilike.%${q.replace(/[\\%_]/g, "")}%`);

  const { data: products, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif font-medium text-[28px] tracking-tight">Products</h1>
          <p className="text-[14px] text-ink-soft mt-1">{count ?? 0} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-4 py-2.5 hover:bg-teal-deep transition-colors"
        >
          <Plus size={15} />
          New product
        </Link>
      </div>

      <form action="/admin/products" method="get" className="flex items-center gap-2 bg-card border border-line rounded-sm px-3 py-2 w-[280px] text-ink-faint focus-within:border-teal transition-colors mb-5">
        <Search size={14} className="shrink-0" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Name or SKU"
          className="border-0 bg-transparent outline-none text-[13px] text-ink w-full placeholder:text-ink-faint"
        />
      </form>

      {!products || products.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-line rounded-[4px]">
          <Package size={28} className="text-ink-faint mx-auto mb-3" />
          <p className="text-[14.5px] font-medium text-ink">No products found</p>
        </div>
      ) : (
        <div className="bg-card border border-line rounded-[4px] overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Product</th>
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Category</th>
                <th className="text-right font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Price</th>
                <th className="text-center font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Tiers</th>
                <th className="text-center font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Stock</th>
                <th className="text-center font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const category = Array.isArray(p.categories) ? p.categories[0]?.name : (p.categories as { name: string } | null)?.name;
                const tierCount = Array.isArray(p.price_tiers) ? p.price_tiers.length : 0;
                return (
                  <tr key={p.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 group">
                        <span className="w-9 h-9 rounded-sm border border-line bg-card relative overflow-hidden shrink-0">
                          {p.images?.[0] && (
                            <Image src={p.images[0]} alt="" fill className="object-contain p-0.5" sizes="36px" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-ink group-hover:text-teal transition-colors truncate max-w-[280px]">
                            {p.name}
                          </span>
                          {p.sku && <span className="block font-mono text-[11px] text-ink-faint">{p.sku}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{category ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular text-amber">{formatPrice(Number(p.price))}</td>
                    <td className="px-4 py-2.5 text-center font-mono tabular text-ink-soft">{tierCount || "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${p.is_in_stock ? "bg-stock-bg text-stock" : "bg-line text-ink-faint"}`}>
                        {p.is_in_stock ? (p.stock_quantity ?? "In stock") : "Out"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">{p.featured ? "★" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6 font-mono text-[12.5px]">
          {page > 1 && (
            <Link href={`/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`} className="px-3 py-1.5 border border-line rounded-sm hover:border-line-strong">
              Prev
            </Link>
          )}
          <span className="px-3 py-1.5 text-ink-soft">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`} className="px-3 py-1.5 border border-line rounded-sm hover:border-line-strong">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
