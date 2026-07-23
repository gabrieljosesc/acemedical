import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import BlogEditor from "@/components/admin/BlogEditor";

export const metadata = { title: "Edit post — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("blog_posts")
    .select("id, title, slug, excerpt, body, is_published, cover_image_url")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-4">
        <Link href="/admin/blog" className="hover:text-teal transition-colors">
          Blog
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink truncate max-w-[280px]">{post.title}</span>
      </nav>
      <h1 className="font-serif font-medium text-[28px] tracking-tight mb-6">Edit post</h1>
      <BlogEditor post={post} />
    </div>
  );
}
