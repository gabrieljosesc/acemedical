import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Blog",
  description: "Clinical insights, product guidance, and industry updates from Ace Medical Wholesale.",
};
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const admin = createAdminClient();
  const { data: posts } = await admin
    .from("blog_posts")
    .select("id, slug, title, excerpt, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-10 py-12">
      <p className="eyebrow mb-2">Insights</p>
      <h1 className="font-serif font-medium text-[32px] sm:text-[38px] tracking-tight mb-3">Blog</h1>
      <p className="text-[15px] text-ink-soft mb-10 max-w-[60ch]">
        Clinical insights, product guidance, and industry updates for licensed practitioners.
      </p>

      {(posts ?? []).length === 0 ? (
        <div className="text-center py-20 border border-dashed border-line rounded-[4px]">
          <Newspaper size={28} className="text-ink-faint mx-auto mb-3" />
          <p className="text-[14.5px] font-medium text-ink">No articles yet</p>
          <p className="text-[13.5px] text-ink-faint mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-line">
          {(posts ?? []).map((post) => (
            <article key={post.id} className="py-7 first:pt-0 group">
              <p className="font-mono text-[11px] tracking-wide uppercase text-ink-faint mb-2">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </p>
              <h2 className="font-serif font-medium text-[22px] tracking-tight mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-teal transition-colors">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="text-[14.5px] text-ink-soft leading-relaxed max-w-[64ch] mb-3">{post.excerpt}</p>
              )}
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-teal hover:underline"
              >
                Read article
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
