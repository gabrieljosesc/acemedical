import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return {};
  return { title: data.title, description: data.excerpt ?? undefined };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("blog_posts")
    .select("title, excerpt, body, published_at, cover_image_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!post) notFound();

  return (
    <article className="mx-auto max-w-[720px] px-5 sm:px-10 py-12">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-8 flex-wrap">
        <Link href="/" className="hover:text-teal transition-colors">
          Home
        </Link>
        <ChevronRight size={13} />
        <Link href="/blog" className="hover:text-teal transition-colors">
          Blog
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink truncate max-w-[220px]">{post.title}</span>
      </nav>

      <p className="font-mono text-[11px] tracking-wide uppercase text-ink-faint mb-3">
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : ""}
      </p>
      <h1 className="font-serif font-medium text-[30px] sm:text-[36px] tracking-tight mb-4 text-balance">
        {post.title}
      </h1>
      {post.cover_image_url && (
        <div className="relative w-full aspect-[16/9] border border-line rounded-sm overflow-hidden mb-8">
          <Image src={post.cover_image_url} alt="" fill className="object-cover" sizes="720px" priority />
        </div>
      )}
      {post.excerpt && (
        <p className="text-[16px] text-ink-soft leading-relaxed mb-8 border-l-2 border-teal pl-4">
          {post.excerpt}
        </p>
      )}

      <div className="text-[15px] text-ink-soft leading-[1.8] whitespace-pre-wrap">{post.body}</div>

      <div className="mt-12 pt-8 border-t border-line">
        <Link href="/blog" className="text-[13.5px] font-medium text-teal hover:underline">
          ← All articles
        </Link>
      </div>
    </article>
  );
}
