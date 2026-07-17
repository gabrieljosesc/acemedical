import Link from "next/link";
import { Plus, Newspaper } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata = { title: "Blog — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const admin = createAdminClient();
  const { data: posts } = await admin
    .from("blog_posts")
    .select("id, slug, title, is_published, published_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif font-medium text-[28px] tracking-tight">Blog</h1>
          <p className="text-[14px] text-ink-soft mt-1">{posts?.length ?? 0} posts</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-sm bg-teal text-[#F4FBF8] font-medium text-[13.5px] px-4 py-2.5 hover:bg-teal-deep transition-colors"
        >
          <Plus size={15} />
          New post
        </Link>
      </div>

      {(posts ?? []).length === 0 ? (
        <div className="text-center py-20 border border-dashed border-line rounded-[4px]">
          <Newspaper size={28} className="text-ink-faint mx-auto mb-3" />
          <p className="text-[14.5px] font-medium text-ink">No posts yet</p>
        </div>
      ) : (
        <div className="bg-card border border-line rounded-[4px] overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Title</th>
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Slug</th>
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Status</th>
                <th className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Published</th>
                <th className="text-right font-mono text-[10.5px] tracking-wide uppercase text-ink-faint px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(posts ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/blog/${p.id}`} className="font-medium text-teal hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12.5px] text-ink-soft">{p.slug}</td>
                  <td className="px-4 py-3">
                    {p.is_published ? (
                      <span className="font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full bg-stock-bg text-stock">
                        Published
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full bg-line text-ink-faint">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("en-US") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-4">
                    <Link href={`/admin/blog/${p.id}`} className="text-[12.5px] text-teal hover:underline">
                      Edit
                    </Link>
                    {p.is_published && (
                      <Link
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        className="text-[12.5px] text-ink-soft hover:text-teal hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
